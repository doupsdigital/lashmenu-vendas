# Analytics de Produto com PostHog — Implementado

> Este documento registra o que **já foi implementado** a partir de `docs/plano_analytics_funil_uso.md`. Use-o como ponto de partida em conversas futuras: se for pedir para mapear uma tela nova, adicionar um evento, criar um cohort, etc., aponte para este arquivo primeiro — ele explica o que já existe, onde, e por quê, para não reimplementar nada nem repetir os mesmos erros que já corrigimos.

## Status

✅ Implementado, testado e em produção (Fases 0 a 7 do plano original completas).

**Projeto PostHog:** "Lash Agenda", Project ID `523717`, região **US Cloud**, host `https://us.i.posthog.com`.

**Commits:**
- `6f266f1` — feat: adiciona analytics de produto com PostHog (implementação inicial completa)
- `f6e00e3` — fix: corrige distinct_id do PostHog e bloqueia SDK no Portal do Cliente (correção crítica pós-teste)

---

## Arquitetura implementada

- **Client-side**: `posthog-js`, inicializado em [src/main.tsx](../src/main.tsx). Autocapture, web vitals e gravação de sessão ativos por padrão nas rotas do app logado e nas páginas públicas de marketing/cadastro/login.
- **Server-side**: triggers SQL em `public.agendamentos` e `public.estabelecimentos` via `pg_net`, para eventos que podem ser originados fora do navegador da profissional (ex: cliente final agendando pelo Portal).
- **Identidade única**: o `distinct_id` usado em **todos os pontos** (client-side e server-side) é o **`estabelecimento_id`** — nunca o `usuarios.id`. Isso é importante e não é óbvio: ver seção "Erro corrigido" abaixo.

---

## Variáveis de ambiente

```
VITE_POSTHOG_KEY=phc_quN9tH5AsE9pdF9WqMTYa9rxvrytiUC7oFtBsy9YSgX9
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

Configuradas em: `.env` local, `.env.example` (vazias, só documentando o padrão), e na Vercel (Production + Preview).

A mesma API key (`phc_...`) também está hardcoded diretamente dentro dos triggers SQL (`scripts/migration_posthog_*.sql`) — é necessário porque uma function do Postgres não tem acesso a variáveis de ambiente do frontend. É uma chave "write-only", segura para expor (a própria interface do PostHog confirma isso).

---

## O que foi instrumentado

### 1. Rastreio de navegação (SPA)
- [src/main.tsx](../src/main.tsx): `posthog.init()` com `capture_pageview: false` (pageview disparado manualmente) e `session_recording.maskAllInputs: false`.
- [src/components/common/PostHogPageview.tsx](../src/components/common/PostHogPageview.tsx): dispara `$pageview` a cada troca de rota via `useLocation()`. Ignora rotas que começam com `/portal/`.
- **Importante**: `posthog.init()` só roda se `window.location.pathname` **não** começar com `/portal/` — ver seção de privacidade abaixo.

### 2. Identify / Reset — [src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx)
- `posthog.identify(profileData.estabelecimento_id, { email, nome_negocio, estabelecimento_id, plano })` — chamado em dois lugares: no listener principal de `onAuthStateChange` e em `refreshProfile()` (para manter propriedades como `plano` atualizadas após upgrades).
- Só identifica quando `profileData.role === 'profissional'` — **nunca identifica clientes finais**.
- `posthog.reset()` no início do `signOut()`.
- O `select` do Supabase em `usuarios` foi ajustado para incluir `nome_negocio` de `estabelecimentos` (não estava sendo buscado antes).

### 3. Eventos de negócio — client-side

| Evento | Onde | Propriedades | Observação |
| :--- | :--- | :--- | :--- |
| `signup_completed` | [CadastroProfissional.tsx](../src/pages/profissional/CadastroProfissional.tsx), antes de `setSuccess(true)` | `estabelecimento_id` | Não existe seleção de plano no cadastro atual, então não há `plano_escolhido` |
| `servico_criado` | [Servicos.tsx](../src/pages/profissional/Servicos.tsx), branch de criação (não edição) | `valor`, `duracao_minutos` | Não existe campo `categoria_id` no formulário atual |
| `horarios_configurados` | [MeusHorarios.tsx](../src/pages/profissional/MeusHorarios.tsx), `handleSaveHorarios` | — | Dispara toda vez que salva (não só na 1ª vez) — o PostHog considera a 1ª ocorrência automaticamente no funil |
| `primeiro_cliente_cadastrado` | [Clientes.tsx](../src/pages/profissional/Clientes.tsx), `handleSave` | — | |
| `link_agendamento_copiado` | **3 lugares**: [LinkAgendamento.tsx](../src/pages/profissional/LinkAgendamento.tsx), [Dashboard.tsx](../src/pages/profissional/Dashboard.tsx) (atalho "Copiar Link Público" na home), [GuidedTourSheet.tsx](../src/components/common/GuidedTourSheet.tsx) (tour guiado) | — | O plano original só citava o primeiro arquivo; os outros dois têm botões de copiar o mesmo link e foram descobertos durante o teste |

### 4. Eventos de negócio — server-side (triggers SQL)

Dois arquivos de migração, aplicados manualmente no **Supabase SQL Editor** (este projeto não usa uma pasta `supabase/migrations` — o padrão é `scripts/migration_*.sql` rodado à mão, mesmo padrão do webhook do WhatsApp e do push notification):

- [scripts/migration_posthog_agendamento_criado.sql](../scripts/migration_posthog_agendamento_criado.sql)
  - Trigger `on_agendamento_insert_posthog` → `AFTER INSERT ON public.agendamentos`
  - Evento `agendamento_criado`, `distinct_id = estabelecimento_id`, propriedades `origem`, `agendamento_id`, `valor_cobrado`

- [scripts/migration_posthog_eventos_adicionais.sql](../scripts/migration_posthog_eventos_adicionais.sql)
  - Trigger `on_agendamento_update_posthog_cancelado` → `AFTER UPDATE ON public.agendamentos`, dispara `agendamento_cancelado` quando `status` vira `'cancelado'`
  - Trigger `on_estabelecimento_update_posthog` → `AFTER UPDATE ON public.estabelecimentos`, dispara:
    - `assinatura_ativada` quando `status_assinatura` vai de `'trial'` para `'ativo'`
    - `plano_upgrade` quando `plano` vai de `'basico'` para `'premium'`
  - Ambos usam `pg_net` (já habilitado no projeto).

Todos os 5 eventos server-side foram testados e confirmados no PostHog, exceto `assinatura_ativada`/`plano_upgrade` (difíceis de testar sem mexer numa assinatura real — a lógica do trigger foi revisada mas não validada ponta a ponta ainda).

### 5. Privacidade e mascaramento de gravação de sessão

Regra geral: **só rastreamos profissionais, nunca clientes finais.**

- **Portal do Cliente (`/portal/...`) — bloqueio total**: `posthog.init()` nem roda nessa rota (ver `main.tsx`). Nenhum script, cookie, gravação ou heatmap acontece lá. Isso cobre 100% dos casos reais porque todo link para o portal abre em nova aba (`target="_blank"`), nunca por navegação client-side dentro do mesmo app.
  - **Isso foi um bug encontrado depois de implementado**: inicialmente só bloqueávamos o `$pageview` manual, mas o SDK continuava gravando sessão e fazendo autocapture por padrão em todas as páginas, inclusive no Portal. Foi corrigido no commit `f6e00e3`.
- **Mascaramento seletivo com a classe `ph-mask`** (é o `maskTextClass` padrão do rrweb/PostHog — mascara texto e valores de input de qualquer elemento com essa classe, sem precisar configurar nada extra):
  - [Clientes.tsx](../src/pages/profissional/Clientes.tsx): lista com nome/WhatsApp
  - [PerfilCliente.tsx](../src/pages/profissional/PerfilCliente.tsx): nome no cabeçalho, cartão de resumo (WhatsApp/e-mail/nascimento), formulário de dados pessoais
  - [FichasAnamnese.tsx](../src/pages/profissional/FichasAnamnese.tsx) e [FichaAnamneseDetalhe.tsx](../src/pages/profissional/FichaAnamneseDetalhe.tsx): mascarados **por inteiro** — essas fichas guardam dado de saúde (alergias, gestante, doenças crônicas), que a LGPD classifica como dado sensível (art. 5º, II)
- **Campos de senha** (`type="password"`) são mascarados automaticamente por padrão, não precisou de `ph-mask`.
- **Decisão consciente de NÃO mascarar** nome/telefone/e-mail em `CadastroProfissional.tsx` e `Login.tsx`: são dados que a própria profissional está fornecendo diretamente ao produto (não dado de terceiro), e a Política de Privacidade já cobre esse uso. Ver esse tipo de distinção antes de decidir mascarar algo novo: **dado de cliente-da-profissional → mascarar/bloquear. Dado da própria profissional sobre ela mesma → pode aparecer.**
- Nova página **[PoliticaPrivacidade.tsx](../src/pages/PoliticaPrivacidade.tsx)** em `/privacidade` (rota pública), linkada no rodapé do cadastro. Menciona o uso do PostHog, o escopo (só profissionais) e o mascaramento. Contato: `doupsdigital@gmail.com`.

### 6. Erro corrigido: `distinct_id` inconsistente

Ao montar o funil (Fase 6), a etapa `agendamento_criado` não conectava com as etapas anteriores (0% de conversão total). Causa: o `identify()` usava `profileData.id` (o `usuarios.id`, ou seja, a conta de login), enquanto o trigger SQL usava `estabelecimento_id` como `distinct_id` — PostHog tratava como duas pessoas diferentes.

**Correção**: `identify()` passou a usar `estabelecimento_id` em todo lugar. Qualquer novo evento/`identify` futuro **deve seguir esse padrão** — nunca usar `usuarios.id` como `distinct_id`.

---

## Configuração feita na interface do PostHog (não é código)

- **Funil "Funil de Ativação"**: `signup_completed` → `servico_criado` → `horarios_configurados` → `agendamento_criado`. Salvo e fixado em "Your starter dashboard" (dashboard inicial/home do projeto).
- **Toolbar autorizado** para `http://localhost:4321` e `https://www.lashagenda.com` (Settings → Toolbar → Authorized URLs).
- **Heatmap** testado e funcionando em `/servicos` e `/meus-horarios` via toolbar (ícone de heatmap na barra flutuante, precisa clicar em "Authenticate" na primeira vez).
- **Cohort "Cadastrou há <7 dias sem serviço"** (dinâmico): `Completed event signup_completed within last 7 days` AND `Did not complete event servico_criado within last 30 days`. Tem um botão direto "View session recordings" para assistir essas sessões.

---

## Convenções a seguir em extensões futuras

1. **Migrações SQL**: criar um novo arquivo `scripts/migration_posthog_<nome>.sql`, nunca uma pasta `supabase/migrations` (não existe nesse projeto). O usuário aplica manualmente no Supabase SQL Editor — sempre dar o passo a passo (abrir SQL Editor → colar → Run) e pedir para testar antes de considerar concluído.
2. **`distinct_id` é sempre `estabelecimento_id`**, nunca `usuarios.id`, nunca dado de cliente final.
3. **Nunca instrumentar nada no Portal do Cliente** (`/portal/...`) — nem eventos, nem heatmap, nem gravação. O bloqueio já existe em `main.tsx`; não precisa reforçar por rota.
4. **Antes de instrumentar uma tela**, confira se já não existe um componente duplicado fazendo a mesma ação em outro lugar (aconteceu com "copiar link" — 3 componentes diferentes faziam a mesma coisa).
5. **Ao mostrar dado de cliente-da-profissional** (nome, WhatsApp, e-mail, saúde): aplicar `ph-mask` na gravação de sessão. Ao mostrar dado da própria profissional sobre ela mesma: normalmente não precisa mascarar.
6. **Depois de qualquer mudança de código**: rodar `npm run build` (o projeto é servido localmente via `vite preview`, não `vite dev` — só rebuildar não basta se o usuário estiver testando via Vercel; nesse caso precisa commit + push).
7. **Commit e push**: o usuário fornece um token do GitHub quando pedir para subir as mudanças (repo: `https://github.com/doupsdigital/lashagenda-v0`). Não fica salvo — precisa pedir de novo a cada sessão nova, a não ser que ele configure credenciais persistentes.
8. **Testar sempre em conjunto com o usuário**: pedir para ele reproduzir o fluxo (local ou produção) e conferir no PostHog (Activity / Session Replay) se o evento chegou, antes de marcar como concluído.

---

## O que ainda não foi feito (não fazia parte do pedido original)

- Testar `assinatura_ativada` e `plano_upgrade` ponta a ponta com uma assinatura real.
- Rotina semanal de acompanhamento (Fase 8 do plano original) — isso é operacional, não técnico.
- Nenhum mapeamento de tela além das citadas acima (Serviços, Meus Horários, Clientes, Perfil do Cliente, Fichas de Anamnese, Cadastro, Login, Dashboard, Link de Agendamento, Tour Guiado).
