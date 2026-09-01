# Plano: Reestruturação Lash Hub → Lash Agenda

## Objetivo

Duas mudanças independentes, executadas em etapas pequenas e testáveis:

1. **Rebranding**: renomear "Lash Hub" para "Lash Agenda" em todo o sistema, **exceto** nas landing pages (que serão ajustadas depois, separadamente, quando os vídeos/criativos novos estiverem prontos).
2. **Inversão dos planos**: hoje o **Básico (R$ 59,90)** tem CRM completo (clientes, serviços, relatórios, faturamento) mas **não tem** agendamento automático; o **Premium (R$ 99,90)** tem tudo. Isso vai virar: o novo **Plano Agenda (R$ 59,90)** foca só no agendamento automático + o mínimo de CRM necessário para ele funcionar (clientes e serviços), com a tela inicial simplificada. O novo **Plano Premium (R$ 89,90)** mantém tudo (CRM completo + relatórios + análises), oferecido como upsell — sem cadeados nos menus.

Nenhuma funcionalidade nova precisa ser criada — é reorganização e mudança de regra de acesso em cima do que já existe e funciona.

**Confirmado com o usuário (2026-07-10):** não há clientes reais pagantes no plano Básico em produção hoje (é ambiente de teste), então a inversão de plano pode ser feita sem plano de migração/comunicação para assinantes existentes. Nome escolhido para o plano de entrada: **"Plano Agenda"** (mantendo o slug `basico` no banco por compatibilidade — só o texto exibido muda).

## Como usar este documento

Cada Fase é independente e testável isoladamente. As caixas de seleção (`- [ ]`) marcam o progresso entre sessões — ao retomar o trabalho, veja aqui onde paramos.

## Processo de execução de cada etapa

Para cada etapa (ou subgrupo de etapas) executada:

1. Eu implemento as mudanças da etapa.
2. Antes de qualquer commit, eu reporto aqui no chat:
   - **O que foi feito** — lista objetiva dos arquivos alterados e o que mudou em cada um.
   - **Como testar** — passo a passo do que você precisa clicar/verificar no navegador. Deixo explícito se é um teste **visual** (só olhar se ficou como esperado), **funcional** (ex: gerar um Pix de teste, criar um estabelecimento com `plano='premium'` e outro com `'basico'` e navegar pelas rotas) ou puramente automático (build/typecheck, sem necessidade de você testar nada manualmente).
3. Eu só crio o commit **depois** da sua aprovação explícita.
4. Só avançamos para a próxima etapa depois do commit aprovado.

---

## Fase 1 — Rebranding "Lash Hub" → "Lash Agenda"

Não mexe em regra de negócio nenhuma, só em texto/branding. Baixo risco.

### 1.1 — Casca do app / PWA
- [x] `index.html` — `<title>` e `apple-mobile-web-app-title`
- [x] `public/manifest.json` — `name`/`short_name`
- [x] `public/sw.js` — comentário do cabeçalho e título padrão da notificação push
- [x] `src/index.css` — comentário do bloco de estilos do onboarding

### 1.2 — Telas da profissional
- [x] `src/components/layout/Sidebar.tsx:90` — fallback `'Lash Hub'` quando não há nome de negócio configurado
- [x] `src/pages/profissional/Login.tsx`
- [x] `src/pages/profissional/CadastroProfissional.tsx`
- [x] `src/pages/profissional/RecuperarSenha.tsx`
- [x] `src/pages/profissional/RedefinirSenha.tsx`
- [x] `src/pages/profissional/Tutoriais.tsx`
- [x] `src/components/common/ProfissionalRoute.tsx` — encontrado durante a execução (tela de loading), não estava listado originalmente

### 1.3 — Portal da cliente
- [x] `src/pages/portal-clientes/PortalLogin.tsx`
- [x] `src/pages/portal-clientes/CadastroCliente.tsx`
- [x] `src/components/layout/PortalLayout.tsx`
- [x] `src/components/common/ClienteRoute.tsx`

### 1.4 — Componentes comuns
- [x] `src/components/common/PushPermissionBanner.tsx` — só tinha uma chave de `localStorage` (`lashhub_push_banner_dismissed`), nenhum texto visível; mantida como está (ver nota abaixo)
- [x] `src/components/common/InstallBanner.tsx`
- [x] `src/components/common/InstallAppCard.tsx`
- [x] `src/hooks/useOnboarding.ts`

### 1.5 — Backend (Edge Functions)
- [x] `supabase/functions/send-push/index.ts` — verificado; só tinha o e-mail `lashhubapp@gmail.com` no `VAPID_SUBJECT` (identificador técnico, não texto de marca — mantido, ver nota abaixo). O título da notificação em si está em `public/sw.js`, já atualizado.
- [x] `supabase/functions/asaas-checkout/index.ts:80` — descrição enviada ao Asaas atualizada para `'Lash Agenda — Plano...'` (o valor cobrado continua igual, isso é Fase 2)

### 1.6 — Scripts e seeds (impacto zero em produção, mas mantém consistência)
- [x] `scripts/seed_demo.sql`, `scripts/seed_mariana_extra.sql`, `scripts/seed_mariana_julho.sql`
- [x] `scripts/schema_definitivo.sql` (comentário do cabeçalho)
- [x] `scripts/cleanup_demo.sql`
- [x] `scripts/create_demo_auth_users.mjs` — comentário do cabeçalho atualizado; a senha padrão `'LashHubDemo123!'` (linha 39) foi **mantida de propósito** (ver nota abaixo)

### 1.7 — Documentação interna
- [x] `docs/PRD - Lash Hub.md` → renomeado para `docs/PRD - Lash Agenda.md` e conteúdo atualizado (a tabela de planos em si só muda na Fase 3)
- [x] `docs/web_push_notifications.md`, `docs/manual_profissional.md`, `docs/manual_cliente.md`, `docs/guia_deploy_producao.md`, `docs/dados_videos.md`, `docs/dados_teste_manual.md`, `docs/processo_integracao_asaas.md`, `docs/plano_notificacoes_trial.md`, `docs/plano_migracao_asaas_producao.md`, `docs/plano_login_google.md`, `docs/plano-notificacoes-telegram.md`, `docs/prompt agente.md`

### Nota sobre o que foi deliberadamente NÃO alterado nesta fase
Em todos os arquivos acima, mantive intactos identificadores técnicos que continham "lashhub" mas não são texto de marca visível — mudá-los exigiria ações fora do código (renomear projeto no Supabase, recriar contas demo, etc.) ou causaria efeitos colaterais desnecessários:
- Refs de projeto Supabase: `lashhub-desenv`, `lashhub-prod`, `lashhub-prd`
- Domínios/e-mails: `lashhub.com`, `lashhub.com.br`, `lashhubapp@gmail.com`, e-mails de contas demo (`mariana.silva@lashhub.com`, etc.)
- Chaves internas sem exibição: classe CSS `.lashhub-onboarding-popover`, chaves de `localStorage` (`lashhub-app-card-dismissed`, `lashhub-install-banner-snoozed`, `lashhub_push_banner_dismissed`), nome de cache do service worker (`lashhub-v1`)
- Senha padrão de conta demo (`LashHubDemo123!`) — já pode estar em uso em contas já criadas
- Nome antigo do repositório GitHub mencionado em docs históricos (`lashhub-v03`) — registro histórico, não uma ação pendente

### Explicitamente FORA da Fase 1 (não tocar, não apagar — ficam exatamente como estão)
- `src/pages/LandingPage_*.tsx` (todas as variações) — o usuário vai editar essas páginas pessoalmente depois (vídeos, criativos, textos), por isso não sofrem nenhuma alteração agora, nem de branding. Nenhum arquivo é removido do projeto.
- `LashHub Tela Inicial (standalone).html` — arquivo solto de referência/protótipo, não faz parte do build; permanece no repositório sem alteração.

---

## Fase 2 — Preparação: textos e preços dos planos (sem mudar regra de acesso ainda)

Mudança visual/textual isolada, ainda sem tocar em `useSubscription`/gating. Assim dá pra validar preço e copy antes de mexer em permissão.

- [x] `src/pages/profissional/Faturamento.tsx` — renomeado "Plano Básico (CRM)" → **"Plano Agenda"** (ícone trocado de `Users` para `Calendar`), "Plano Premium (Agenda)" → **"Plano Premium"**; preços atualizados: R$ 59,90 (Agenda) e R$ 89,90 (Premium, era 99,90); benefícios de cada card reescritos refletindo a nova divisão (Agenda = agendamento + cadastro básico; Premium = tudo + relatórios/anamnese/histórico); rótulos "Básico"/"Premium" no painel de status e nas telas de checkout/sucesso também atualizados
- [x] `supabase/functions/asaas-checkout/index.ts:79-80` — `valor` do premium alterado de `99.90` para `89.90`; `descricao` atualizada para `Lash Agenda — Plano Agenda` / `Lash Agenda — Plano Premium`
- [x] `src/components/layout/Layout.tsx` — texto do toast de boas-vindas pós-checkout ("Plano Básico ativo!" → "Plano Agenda ativo!") — adicional encontrado durante a execução, não estava listado originalmente
- [x] ~~Redeploy da Edge Function~~ — feito no deploy final (ver checklist consolidado em **"Lembretes — Deploy final de Edge Functions"**).
- [x] ~~Teste manual de checkout Pix~~ — feito no deploy final, com valores reduzidos de teste (R$ 5 / R$ 10) direto no Asaas em produção; confirmado funcionando.

> **Nota:** como confirmado, não há assinantes reais hoje, então não existe assinatura antiga em valor divergente para se preocupar. Até o redeploy final, o código local já está correto (R$ 89,90), mas a Edge Function rodando ao vivo no Supabase ainda cobra o valor antigo (R$ 99,90) — sem risco, pois não há cobranças reais em andamento.

---

## Fase 3 — Inverter as regras de acesso (o core da mudança)

Esta é a fase que efetivamente muda quem vê o quê. Fazer com atenção e testar cada plano (crie/edite um estabelecimento de teste em cada `plano`).

- [x] `src/hooks/useSubscription.ts` — `hasFeature` invertida: `scheduling`/`dashboard` → `true` para ambos os planos; `crm` → `true` somente para `premium`
- [x] `src/App.tsx` — `agendamentos` e `meus-horarios` saíram do `PlanGuard`, ficam só atrás do `BillingGuard` (acessíveis a todos os planos); `relatorios` agora está dentro de `<PlanGuard requiredFeature="crm">`
- [x] `src/pages/portal-clientes/PortalAgendar.tsx` — removido o redirect que bloqueava clientes de estabelecimentos `plano === 'basico'`
- [x] `src/pages/portal-clientes/PortalCatalogo.tsx` — removida a flag `isBasico`, o banner de WhatsApp e a variante do card de serviço só-WhatsApp; agora todo mundo vê o botão "Agendar" normal
- [x] `src/components/layout/PortalLayout.tsx` — **adicional encontrado durante a execução, não estava no plano original**: essa tela também escondia os itens "Agendar"/"Meus Agendamentos"/"Meu Perfil" e até o botão "Entrar" para clientes de estúdios básico. Removida a mesma restrição aqui.
- [x] `src/components/layout/Sidebar.tsx` e `src/components/layout/TabBar.tsx` — removida toda a lógica de cadeado/`UpgradeModal` disparado por clique; Sidebar agora filtra os itens de menu (Relatórios exige `feature: 'crm'`, some do menu para quem é básico em vez de aparecer bloqueado); TabBar simplificado (não tinha nenhum item exigindo `crm`, então perdeu toda a lógica de bloqueio)
- [x] `src/components/common/BillingGuard.tsx` — lista de benefícios do Premium atualizada para citar Relatórios/Histórico/Anamnese em vez de "Portal de agendamento" e "histórico financeiro"
- [x] `src/components/common/UpgradeModal.tsx` — pitch reescrito para CRM/Relatórios/Análises (o gatilho visual que abria esse modal foi removido nesta fase junto com os cadeados; ele volta a ser usado na Fase 6, com um ponto de entrada novo)
- [x] Teste manual completo — validado navegando com uma conta no plano Agenda e outra no Premium (feito ao longo das fases seguintes)

---

## Fase 4 — Redesenho da tela inicial (Dashboard) no estilo do print de referência

A maior parte dos dados já existe em `Dashboard.tsx` (agendamentos de hoje, faturamento, próximos atendimentos) — é reorganização de layout, não nova lógica de dados.

- [x] Adicionado card "Compartilhe sua Agenda" em destaque (cor da marca), com botão "Copiar Link Público" (mesma lógica de cópia + fallback do `LinkAgendamento.tsx`) — aparece para os dois planos, logo abaixo dos KPIs
- [x] KPIs simplificados para o plano Agenda: "Agendas Hoje" (contagem) + "Caixa Hoje" (soma dos agendamentos concluídos **do dia**, nova query separada da mensal). Plano Premium manteve os 4 cards originais (Faturamento do Mês, Agendamentos Hoje, Aguardando Confirmação, Novas Clientes) sem alteração
- [x] Seção renomeada para "Próximos Clientes" com link "Ver agenda →" ao lado do título, presente nos dois planos
- [x] Dashboard diferenciado por plano: Agenda esconde Ações Rápidas e o gráfico de receita/crescimento de 7 dias; Premium mantém tudo como estava
- [x] Badge de plano adicionado ao lado da saudação ("AGENDA" ou "PRO" com ícone de coroa)

---

## Fase 5 — Navegação mobile (TabBar) e Sidebar reorganizados

- [x] `TabBar.tsx` — trocado para 5 itens fixos: Início, Clientes, **Agenda (botão central flutuante em destaque)**, Serviços, Config. O botão "Mais" foi removido — **descoberta durante a execução**: o `Header.tsx` já tinha um ícone de hambúrguer (canto superior esquerdo, mobile) que abre a Sidebar como gaveta, então essa era uma segunda porta de entrada redundante para a mesma coisa. Configurações/Assinatura/Suporte continuam acessíveis por ali, sem necessidade de decidir um novo lugar para eles.
- [x] `src/components/layout/Layout.tsx` — removida a prop `onMoreClick` do `<TabBar />` (não é mais necessária)
- [x] `Sidebar.tsx` (desktop) — itens reordenados para priorizar Agendamentos logo após Meu Estúdio (cadeados já tinham sido removidos na Fase 3). **Nota de escopo:** o card de upsell Premium no rodapé fica para a Fase 6, que já é dona desse entregável — evita fazer o mesmo trabalho duas vezes.
- [x] Teste em mobile (viewport reduzido) e desktop — aprovado pelo usuário, incluindo ajuste extra do ícone de "Serviços" (`Tag` → `Eye` → `WandSparkles`, decidido junto com o usuário)

---

## Fase 6 — Upsell do Premium (substituir o modelo de cadeado)

- [x] Decisão do usuário (2026-07-10): **sem banner na tela inicial** do plano Agenda — não queria poluir a home simplificada. O CTA de upsell fica só na **Sidebar** (funciona tanto no menu fixo do desktop quanto na gaveta mobile aberta pelo hambúrguer — é o mesmo componente).
- [x] `src/components/layout/Sidebar.tsx` — adicionado card "Premium" no rodapé (acima do cartão do usuário), visível apenas para quem **não** é premium e com a sidebar expandida (não aparece quando colapsada, por falta de espaço). Botão "Conhecer o Premium" abre o `UpgradeModal`.
- [x] `UpgradeModal.tsx` — já tinha sido reescrito com o pitch novo (CRM/Relatórios/Análises) na Fase 3, quando o gatilho antigo (cadeado) foi removido; não precisou de mudança agora, só ganhou um gatilho novamente.
- [x] Fluxo ponta a ponta: card na Sidebar → abre `UpgradeModal` → botão "Fazer Upgrade no Painel" → navega para `/assinatura` (`Faturamento.tsx`, já validado na Fase 2) → assinar Premium
- [x] Ajustes finos pedidos durante a revisão visual: badge do ícone de coroa não sobrepõe mais a decoração de estrelas na saudação; "Fichas de anamnese" saiu da lista de "exclusivo Premium" (ver bloco abaixo, depois revertido); modal fecha a gaveta mobile junto (`setMobileOpen(false)` adicionado ao `onClose`)

### Adicional — Fichas de Anamnese vira funcionalidade própria do Premium (decisão do usuário, 2026-07-10)

Depois de testar, o usuário decidiu inverter o que tinha sido feito antes: em vez de fichas de anamnese fazerem parte do plano Agenda, elas viram uma **funcionalidade nova e mais completa, exclusiva do Premium**, com tela própria (não mais uma aba dentro do perfil da cliente).

- [x] `src/types/index.ts` — `anamnese_lash` (JSONB, já existia no banco — **sem migração necessária**) ganhou campos novos: perfil do olho (formato, espaçamento, densidade/comprimento/curvatura dos cílios naturais), preferências técnicas (técnica, mapping, curvatura, espessura, comprimento, efeito desejado) e retenção (tempo médio de retenção, frequência de manutenção, tipo de adesivo, observações)
- [x] `src/pages/profissional/FichasAnamnese.tsx` (nova) — lista de clientes com busca, badge "Ficha preenchida"/"Ficha pendente", clica e vai para a ficha da cliente
- [x] `src/pages/profissional/FichaAnamneseDetalhe.tsx` (nova) — tela completa e dedicada por cliente, com as seções antigas (Histórico & Cuidados Oculares, Condições Clínicas, Alergias) reaproveitadas + 3 seções novas (Perfil do Olho & Cílios Naturais, Preferências Técnicas, Retenção & Cuidados)
- [x] `src/pages/profissional/PerfilCliente.tsx` — removida a aba "Ficha Clínica (Anamnese)"; adicionado botão "Ficha de Anamnese" (visível só no Premium) que leva direto para a nova tela dedicada dessa cliente
- [x] `src/App.tsx` — novas rotas `fichas-anamnese` e `fichas-anamnese/:id`, protegidas por `PlanGuard requiredFeature="crm"` (mesma proteção de Relatórios)
- [x] `src/components/layout/Sidebar.tsx` e `Header.tsx` — novo item de menu "Fichas de Anamnese" (ícone `ClipboardPen`), só aparece pro Premium, mesmo padrão do Relatórios. Não entrou na TabBar (ela é fixa em 5 itens para os dois planos, igual Relatórios também não entrou)

---

## Fase 7 — Simplificação adicional do plano Agenda ✅ **Concluída/desnecessária**

**Decisão do usuário (2026-07-10):** depois de ver o app funcionando com as Fases 1-6, não quer simplificar mais nada por enquanto no plano Agenda. O primeiro item (ficha de anamnese completa) já ficou resolvido naturalmente pela Fase 6 — a ficha de anamnese virou funcionalidade própria e exclusiva do Premium, então nem existe mais dentro do plano Agenda para simplificar. O segundo item (esconder histórico de `atendimentos` em `Clientes.tsx`) fica como está, sem alteração.

---

## Fase 8 — Documentação final

- [x] `docs/PRD - Lash Agenda.md` — reescrito: tabela de planos definitiva (Agenda R$ 59,90 / Premium R$ 89,90), tela inicial diferenciada por plano, módulo de Fichas de Anamnese, navegação (Sidebar reordenada + TabBar de 5 posições), upsell sem cadeados, estrutura de projeto atualizada com as páginas novas
- [x] `docs/manual_profissional.md` — removidas as marcações "exclusivo Premium" de Agendamentos/Meus Horários (agora são de ambos os planos); nova seção "Fichas de Anamnese — Exclusivo do Plano Premium" descrevendo os campos técnicos novos; comparativo de planos e prompts de marketing (seção 9) reescritos com os nomes/preços corretos; corrigido resquício do nome antigo "LashCenter"
- [x] `docs/manual_cliente.md` — removida a menção ao modo "só WhatsApp" do plano básico no catálogo e no FAQ, já que hoje o agendamento online está disponível para clientes de qualquer plano da profissional

---

## Fora de escopo deste plano (tratar depois, separadamente)
- Landing pages (`LandingPage_*.tsx`) — não serão alteradas nem apagadas neste plano; o usuário vai editá-las pessoalmente depois, quando tiver os vídeos/criativos novos prontos
- Migração de assinantes reais — não aplicável (confirmado: sem clientes pagantes no básico hoje)

---

## Lembretes — Deploy final de Edge Functions

**Decisão do usuário (2026-07-10):** não fazer redeploy de Edge Functions do Supabase a cada etapa deste plano. O código-fonte é ajustado normalmente a cada fase (e commitado), mas o redeploy real no Supabase (que exige `supabase login` com credenciais do usuário) fica concentrado para **o final**, quando todo o sistema já estiver ajustado. Até lá, a versão rodando ao vivo no Supabase continua com o comportamento antigo — sem risco, pois não há assinantes reais hoje.

Checklist executado (revisão feita função por função, uma de cada vez, no chat):
- [x] `asaas-checkout` — valor do Premium (R$ 89,90) e descrição ("Lash Agenda — Plano ...") — alterado na Fase 2, redeploy feito
- [x] `asaas-check-payment` — **encontrado na revisão final**: threshold de detecção de plano (`valor >= 90`) estava desatualizado por causa do preço novo do Premium (R$ 89,90 < 90) e classificava pagamento Premium como `basico`; corrigido para `>= 75`, redeploy feito
- [x] `asaas-webhook` — mesmo bug e mesma correção do `asaas-check-payment` (esta é a função principal, o check-payment é só fallback); redeploy feito
- [x] `asaas-cancel` — revisada, sem alteração necessária (não tem branding nem valores)
- [x] `notify-new-professional` — revisada, sem alteração necessária
- [x] `send-push` — revisada; único resquício encontrado foi o e-mail de fallback do `VAPID_SUBJECT` (`lashhubapp@gmail.com`), mantido de propósito por decisão do usuário (é só um fallback técnico, provavelmente nunca usado)
- [x] Rodado `npx supabase functions deploy <nome-da-funcao>` para as 3 funções alteradas
- [x] Teste manual pós-deploy: checkout Pix com valores reduzidos de teste (Agenda R$ 5 / Premium R$ 10) direto em produção no Asaas, threshold do webhook ajustado temporariamente (`>= 7.5`) durante o teste e revertido depois; confirmado funcionando para os dois planos
