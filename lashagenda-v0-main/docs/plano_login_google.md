# Plano: Login com Google (Profissional + Portal do Cliente)

## Contexto

Hoje o Lash Agenda só autentica via Supabase Auth com email/senha, em dois fluxos independentes: Profissional (`/login`, `/cadastro`) e Portal do Cliente (`/portal/:slug/login`, `/portal/:slug/cadastro`). O objetivo é reduzir fricção no cadastro/login oferecendo "Continuar com Google" nos dois fluxos, sem quebrar o fluxo de senha existente.

**Risco arquitetural identificado (verificado no código):** o onboarding hoje depende 100% de um trigger no banco (`handle_new_user_onboarding`, `scripts/schema_definitivo.sql:242-372`) que lê `role`, `nome_negocio`, `slug`, `cliente_id`, `estabelecimento_id` do `raw_user_meta_data` — dados que só existem porque `supabase.auth.signUp()` aceita `options.data`. O login OAuth do Google **não tem equivalente**: o Supabase popula `raw_user_meta_data` só com o que o Google devolve (nome, email, foto), então:
- O trigger hoje faz `user_role := COALESCE(raw_user_meta_data->>'role', 'profissional')` — para um login Google puro, cairia em `'profissional'`, mas como `negocio_nome` é `NULL`, a condição do bloco `IF` falha e **nada é inserido em `usuarios`** — o usuário fica com um `auth.users` órfão, sem perfil.
- Pior: `AuthContext.tsx:80-92` já tem uma lógica que, se não encontrar linha em `usuarios` após 1 retry (150ms), **desloga o usuário automaticamente** (`supabase.auth.signOut()`). Confirmei isso lendo o arquivo — isso significa que, sem ajuste, um novo usuário Google seria deslogado sozinho a ~150-300ms do login, antes de qualquer tela de "completar cadastro" conseguir agir.

O plano resolve os dois problemas explicitamente, além da integração OAuth em si. Escopo aprovado: **ambos os fluxos** (Profissional e Cliente) na mesma entrega.

---

## Fase 0 — Configuração manual (sem código)

1. **Google Cloud Console**: criar OAuth Client ID (Web application). Authorized redirect URI = URL de callback do **Supabase** (`https://<project-ref>.supabase.co/auth/v1/callback`), não do app React.
2. **Supabase Dashboard → Authentication → Providers → Google**: habilitar, colar Client ID/Secret.
3. **Supabase Dashboard → Authentication → URL Configuration**: adicionar `/auth/callback` e `/portal/*/auth/callback` na allow-list de Redirect URLs.
4. Habilitar (ou confirmar habilitado) o auto-linking de contas com mesmo email verificado — é o que evita erro quando alguém já tem conta por senha e tenta entrar via Google com o mesmo email.

---

## Fase 1 — Migration SQL

Novo arquivo `scripts/migration_google_oauth.sql` (mesma convenção do `schema_definitivo.sql`), aplicado também no `schema_definitivo.sql` para manter esse arquivo como fonte de verdade do estado atual.

1. **Extrair** o bloco de seed profissional (~90 linhas: estabelecimento, usuarios, config, categorias, serviços, variações, horários) do trigger para uma função interna nova `_seed_profissional_onboarding(p_user_id, p_email, p_nome_negocio, p_slug, p_telefone)` — reaproveitada tanto pelo trigger (fluxo senha) quanto pela nova RPC (fluxo Google), garantindo dado idêntico nos dois caminhos.
2. **Modificar `handle_new_user_onboarding()`**: remover o `COALESCE(..., 'profissional')` (deixar `user_role` nulo se ausente); manter os branches `profissional`/`cliente` existentes intactos (fluxo senha não muda); adicionar um `ELSE` explícito que não faz nada — no-op documentado para o caso OAuth, ao invés de órfão acidental.
3. **Nova RPC `complete_profissional_onboarding(p_nome_negocio, p_telefone, p_slug default null)`**: `SECURITY DEFINER`, usa `auth.uid()`. Guarda: erro se já existe `usuarios` para esse id; erro se não autenticado. Resolve slug único (mesma lógica de dedupe usada hoje no client em `CadastroProfissional.tsx`). Chama `_seed_profissional_onboarding`. Retorna `estabelecimento_id`/`slug`. `GRANT EXECUTE TO authenticated`.
4. **Nova RPC `complete_cliente_onboarding(p_slug, p_nome, p_telefone)`**: mesmas guardas. Resolve `estabelecimento_id` pelo slug (erro se não existir). Busca cliente existente por email nesse estabelecimento (reaproveitando a lógica de `get_cliente_id_by_email_or_whatsapp`) ou cria linha nova em `clientes`. Insere `usuarios` com `role='cliente'`. Retorna `estabelecimento_id`/`cliente_id`. `GRANT EXECUTE TO authenticated`.

---

## Fase 2 — Helper de OAuth + rota de callback

1. **Novo `src/lib/oauth.ts`**: `signInWithGoogle(role, { slug? })` grava um pequeno contexto pendente (`{ role, slug }`) em `localStorage` (única forma de "carregar" essa info pelo redirect, já que `signInWithOAuth` não tem `options.data`), calcula `redirectTo` (`/auth/callback` para profissional, `/portal/:slug/auth/callback` para cliente) e chama `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`. Mais `readPendingOAuthContext()`/`clearPendingOAuthContext()`.

2. **Ajuste em `AuthContext.tsx` (linhas 80-92)**: antes do `signOut()` automático quando não encontra perfil, checar se existe contexto OAuth pendente no localStorage — se existir, **não deslogar**, apenas seguir com `profile = null`, `loading = false`, mantendo `user` populado. Isso é o que permite a tela de "completar cadastro" existir e chamar a RPC com uma sessão viva. Só volta ao comportamento normal (deslogar se não achar perfil) depois que o contexto pendente for limpo (ao final do onboarding).

3. **Nova página `src/pages/auth/AuthCallback.tsx`** (fluxo profissional): ao montar, espera `loading` resolver; se `profile` existe → limpa contexto, redireciona `/meu-estudio`; se `user` existe mas `profile` não (novo cadastro Google) → redireciona `/completar-cadastro` (mantendo o contexto pendente); se nem `user` nem `profile` → tela de erro simples com link para `/login`.

4. **Nova página `src/pages/portal-clientes/PortalAuthCallback.tsx`** (fluxo cliente): mesma lógica, mas dentro da árvore `/portal/:slug`, usando `usePortal()` para o slug. Redireciona para `/portal/:slug/catalogo` (existente) ou `/portal/:slug/completar-cadastro` (novo). Aplica a mesma checagem de "cliente de outro estúdio" que `PortalLogin.tsx` já tem.

5. **Rotas em `App.tsx`**: adicionar `/auth/callback` e `/completar-cadastro` junto das rotas públicas do profissional (perto de `/login`, `/cadastro`, linha ~103-106); adicionar `auth/callback` e `completar-cadastro` como irmãos de `catalogo`/`login`/`cadastro` dentro do grupo `/portal/:slug` (linha ~151-154) — fora do bloco protegido por `ClienteRoute`, pelo mesmo motivo do profissional (o perfil ainda não existe nesse momento).

---

## Fase 3 — UI Profissional

1. **Novo `src/components/common/GoogleAuthButton.tsx`**: botão outline no padrão visual do Google ("G" colorido + texto), props `{ role, slug?, label, onError }`, chama `signInWithGoogle`, estado de loading próprio, erros repassados via `onError` para reaproveitar o banner de erro que já existe nas páginas.
2. **`Login.tsx`**: adicionar `<GoogleAuthButton role="profissional" label="Entrar com Google" onError={setErrorMsg} />` abaixo do botão de submit existente. Sem outras mudanças — o redirect pós-login já existente independe de como a sessão foi criada.
3. **`CadastroProfissional.tsx`**: mesmo botão, label "Continuar com Google", sem tocar no `handleSubmit` atual.
4. **Nova página `src/pages/profissional/CompletarCadastroProfissional.tsx`**: formulário curto (nome do negócio pré-preenchido do perfil Google + telefone, mesma máscara já usada em `CadastroProfissional.tsx`). Ao enviar, chama a RPC `complete_profissional_onboarding`; em caso de sucesso, `clearPendingOAuthContext()`, `refreshProfile()`, navega para `/configuracoes`. Não repetir o seed client-side de horários que `CadastroProfissional.tsx` faz hoje (linhas 151-159) — já está dentro da RPC.

---

## Fase 4 — UI Cliente (Portal)

1. **`PortalLogin.tsx`**: `<GoogleAuthButton role="cliente" slug={slug} label="Entrar com Google" onError={setErrorMsg} />` abaixo do submit existente.
2. **`CadastroCliente.tsx`**: mesmo botão, label "Continuar com Google".
3. **Nova página `src/pages/portal-clientes/CompletarCadastroCliente.tsx`**: dentro de `/portal/:slug`, já tem `slug`/`estabelecimento` via `usePortal()`. Formulário curto (nome + WhatsApp). Chama `complete_cliente_onboarding`; em sucesso, limpa contexto, `refreshProfile()`, navega para `/portal/:slug/catalogo`.

---

## Arquivos novos/modificados

**Novos:** `scripts/migration_google_oauth.sql`, `src/lib/oauth.ts`, `src/pages/auth/AuthCallback.tsx`, `src/pages/portal-clientes/PortalAuthCallback.tsx`, `src/pages/profissional/CompletarCadastroProfissional.tsx`, `src/pages/portal-clientes/CompletarCadastroCliente.tsx`, `src/components/common/GoogleAuthButton.tsx`

**Modificados:** `src/contexts/AuthContext.tsx`, `src/App.tsx`, `src/pages/profissional/Login.tsx`, `src/pages/profissional/CadastroProfissional.tsx`, `src/pages/portal-clientes/PortalLogin.tsx`, `src/pages/portal-clientes/CadastroCliente.tsx`, `scripts/schema_definitivo.sql`

---

## Verificação (matriz manual, rodar em staging)

| # | Cenário | Resultado esperado |
|---|---|---|
| a | Cadastro Google novo — profissional | `/auth/callback` → `/completar-cadastro` → submit → `/configuracoes` com estabelecimento/serviços/horários iguais ao fluxo de senha |
| b | Cadastro Google novo — cliente de um slug específico | `/portal/:slug/auth/callback` → `/portal/:slug/completar-cadastro` → submit → `/portal/:slug/catalogo`; `usuarios.estabelecimento_id` bate com o slug certo |
| c | Login Google retornando (ambos os papéis) | Vai direto pro dashboard, sem passar por completar-cadastro |
| d | Login Google com email que já tem conta por senha | Faz merge na mesma identidade (dashboard Fase 0), sem duplicar `usuarios` |
| e | Fluxo de senha (cadastro/login, ambos os papéis) | Continua funcionando exatamente como hoje |

Casos extras a testar rapidamente: abandonar o formulário de "completar cadastro" no meio (fechar aba) e voltar depois; duplo submit do formulário de completar cadastro (deve dar erro claro pela guarda da RPC, não duplicar linha).

Fases 0-4 precisam subir juntas — a migration muda o comportamento do trigger, então não faz sentido implantar o frontend sem o banco atualizado (e vice-versa).
