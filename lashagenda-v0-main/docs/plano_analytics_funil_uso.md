# Plano: Analytics de Produto (Funil de Ativação + Usabilidade) com PostHog

## Objetivo

Hoje não existe nenhuma telemetria de comportamento do usuário dentro do sistema (o que existe é a tabela `logs`, que é um log de auditoria — "quem fez o quê", não uma ferramenta de analytics). Precisamos responder duas perguntas diferentes:

1. **Funil de ativação:** depois que a profissional cria a conta, quanto tempo ela leva até dar cada passo importante (1º login, cadastrar serviço, configurar horários, receber o 1º agendamento)? Onde ela trava ou desiste?
2. **Usabilidade geral:** como ela navega no sistema no dia a dia? Em que tela ela clica muito e não acha o que quer? Onde ela hesita?

Este documento propõe usar o **PostHog** para resolver as duas coisas com uma única instalação, e detalha exatamente onde e como instrumentar o código deste projeto.

---

## Por que as duas perguntas podem ser resolvidas pela mesma ferramenta

| Necessidade | Como o PostHog resolve |
| :--- | :--- |
| Funil de ativação (`criou conta → 1º login → serviço → horários → 1º agendamento`) | **Eventos nomeados** (`posthog.capture('evento', {...})`) + relatório de **Funil** nativo, que já calcula conversão e **tempo entre etapas** (mediana, p90) automaticamente — é literalmente o gráfico que você desenhou. |
| Usabilidade / navegação geral | **Autocapture** (captura cliques, envios de formulário e pageviews sem precisar instrumentar tela por tela) + **Gravação de sessão** (assistir a sessão da profissional como um vídeo) + **Heatmaps** (mapa de calor de cliques por página). |

Ou seja: os eventos nomeados cobrem o funil específico do seu fluxo de negócio, e o autocapture/gravação de sessão cobre a parte exploratória de "como ela usa o sistema", sem precisar de duas ferramentas.

---

## Por que PostHog (e não construir do zero em cima do Supabase)

| Critério | PostHog | Construir em cima do Supabase (tabela própria + Metabase) |
| :--- | :--- | :--- |
| Tempo até ter o primeiro funil funcionando | Horas (script + eventos) | Dias/semanas (schema, views SQL, dashboard) |
| Cálculo de tempo-entre-etapas | Nativo, automático | Precisa escrever a query SQL de "diferença de timestamp entre eventos por usuário" |
| Gravação de sessão / heatmap | Nativo | Não existe — teria que integrar outra ferramenta separada |
| Custo | Grátis até ~1M eventos/mês (mais que suficiente pro estágio atual) | "Grátis" mas custa tempo de desenvolvimento |
| Dono dos dados | Fica em servidor da PostHog (Cloud US ou EU) | 100% no seu Supabase |
| Complexidade de manutenção | Baixa (é um SaaS) | Você mantém a infraestrutura de analytics |

**Recomendação:** PostHog Cloud, região **US**. Como o sistema roda inteiramente para usuários no Brasil, a região US tem latência menor até o Brasil do que a região EU (datacenter mais próximo). A LGPD não exige que os dados fiquem hospedados no Brasil ou na União Europeia — ela se aplica pelo fato de tratarmos dados de pessoas no Brasil, independente de onde o servidor está, então a escolha de região aqui é puramente uma questão de performance, não de conformidade. Se um dia o volume justificar, dá pra migrar pra self-host do PostHog (open-source) sem trocar de ferramenta.

---

## Arquitetura geral

```
┌─────────────────────────────┐
│   Navegador da Profissional  │
│  (área logada /agendamentos, │
│   /servicos, /meus-horarios) │
│                               │
│  posthog-js (autocapture +   │
│  session recording + eventos │
│  nomeados)                   │
└───────────────┬───────────────┘
                │ eventos client-side
                ▼
        ┌───────────────┐
        │   PostHog      │◄──── eventos server-side
        │   (Cloud US)   │      (ver abaixo)
        └───────────────┘
                ▲
                │ HTTP POST /capture (via pg_net)
┌───────────────┴───────────────┐
│   Supabase (Postgres)          │
│   Trigger AFTER INSERT em      │
│   public.agendamentos          │
└─────────────────────────────────┘
```

**Por que existe uma parte "server-side"?** O evento "1º agendamento" pode ser criado por **quem não é a profissional**: uma cliente final agendando pelo Portal público (`/portal/...`), num navegador totalmente diferente, sem sessão logada da profissional. Se depender só do JS do navegador da profissional, esse evento nunca dispararia quando o agendamento vem do Portal. Por isso, esse evento específico é disparado direto do banco de dados via trigger (o mesmo padrão que já existe no projeto para o webhook do WhatsApp, ver `docs/plano_notificacoes_whatsapp.md`), garantindo que ele sempre é capturado, não importa quem criou o agendamento.

---

## Mapa do funil → eventos

| Etapa do seu fluxo | Nome do evento PostHog | Disparado onde | Client ou Server-side |
| :--- | :--- | :--- | :--- |
| Criou conta | `signup_completed` | [CadastroProfissional.tsx:161](../src/pages/profissional/CadastroProfissional.tsx#L161) (logo após `setSuccess(true)`) | Client |
| Entrou pela 1ª vez | `identify` automático (não é bem um "evento", é o momento em que a pessoa passa a ser rastreada) | [AuthContext.tsx:95-97](../src/contexts/AuthContext.tsx#L95-L97) | Client |
| Cadastrou serviço | `servico_criado` | [Servicos.tsx:395-408](../src/pages/profissional/Servicos.tsx#L395-L408) (branch de criação, não de edição) | Client |
| Configurou horários | `horarios_configurados` | [MeusHorarios.tsx:164](../src/pages/profissional/MeusHorarios.tsx#L164) (`handleSaveHorarios`) | Client |
| Primeiro agendamento | `agendamento_criado` (com propriedade `origem`: `admin` ou `portal`) | Trigger SQL em `public.agendamentos` (novo) | **Server** |

> Nota: não precisamos calcular "é o primeiro?" na mão. O relatório de Funil do PostHog já considera automaticamente a *primeira ocorrência* de cada evento por pessoa/entidade depois da etapa anterior — é assim que ele calcula "quantos dias entre o cadastro do serviço e o 1º agendamento".

---

## Plano de implementação

### Fase 0 — Conta e credenciais
1. Criar conta em [posthog.com](https://posthog.com), projeto novo, região **US** (menor latência a partir do Brasil).
2. Copiar a **Project API Key** (`phc_...`) e o **Host** (`https://us.i.posthog.com`).
3. Adicionar como variáveis de ambiente no projeto (mesmo padrão do `VITE_SUPABASE_URL`):
   ```
   VITE_POSTHOG_KEY=phc_xxxxxxxx
   VITE_POSTHOG_HOST=https://us.i.posthog.com
   ```
   Adicionar também nas variáveis de ambiente da Vercel (Production + Preview).

### Fase 1 — Instalação do SDK e rastreio de navegação (SPA)
1. `npm install posthog-js`
2. Inicializar uma única vez em [main.tsx](../src/main.tsx), **antes** do `ReactDOM.createRoot`:
   ```ts
   import posthog from 'posthog-js';

   posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
     api_host: import.meta.env.VITE_POSTHOG_HOST,
     capture_pageview: false, // SPA: vamos disparar manualmente no roteador
     session_recording: {
       maskAllInputs: false, // decisão detalhada na Fase 5 (privacidade)
     },
   });
   ```
3. Como é uma SPA (React Router, sem reload de página), o PostHog **não sabe sozinho** quando a rota muda. Criar um pequeno componente/hook dentro de [App.tsx](../src/App.tsx) que escuta `useLocation()` e chama `posthog.capture('$pageview')` a cada troca de rota — mesmo princípio de uma "página vista" tradicional, adaptado pra SPA.
4. Rodar **só** nas rotas do app logado (`/agendamentos`, `/servicos`, `/clientes`, etc.) e no fluxo de cadastro/login. **Não** precisa rodar nas telas do Portal do Cliente (`/portal/...`) — não queremos rastrear comportamento de clientes finais, só das profissionais (ver Fase 5, privacidade).

### Fase 2 — Identificar a profissional (liga os eventos à pessoa certa ao longo do tempo)
Em [AuthContext.tsx](../src/contexts/AuthContext.tsx), logo após `setEstabelecimentoId(profileData.estabelecimento_id ?? null)` (linhas 95-97 e também no bloco de restauração de sessão):
```ts
if (profileData.role === 'profissional') {
  posthog.identify(profileData.id, {
    email: profileData.email,
    nome_negocio: profileData.estabelecimentos?.nome_negocio,
    estabelecimento_id: profileData.estabelecimento_id,
    plano: profileData.estabelecimentos?.plano,
  });
}
```
E no `signOut` (linha 116), antes de limpar o estado:
```ts
posthog.reset();
```
Isso evita que, se duas profissionais usarem o mesmo computador/navegador, os eventos de uma "vazem" pro perfil da outra.

### Fase 3 — Eventos de negócio (client-side)

**`signup_completed`** — [CadastroProfissional.tsx:161](../src/pages/profissional/CadastroProfissional.tsx#L161):
```ts
setSuccess(true);
posthog.capture('signup_completed', {
  estabelecimento_id: data?.estabelecimento_id,
  plano_escolhido: planoSelecionado, // nome exato da variável a confirmar no arquivo
});
```

**`servico_criado`** — [Servicos.tsx:395-408](../src/pages/profissional/Servicos.tsx#L395-L408), dentro do branch `else` (criação, não edição), logo após o `.insert(...).select().single()` ter sucesso:
```ts
posthog.capture('servico_criado', {
  categoria_id: servicoCategoriaId,
  valor: valorFinal,
  duracao_minutos: duracaoFinal,
});
```

**`horarios_configurados`** — [MeusHorarios.tsx:164](../src/pages/profissional/MeusHorarios.tsx#L164), ao final de `handleSaveHorarios` com sucesso:
```ts
posthog.capture('horarios_configurados');
```

### Fase 4 — Evento server-side: `agendamento_criado`
**Decisão:** começar pelo trigger SQL direto (mais rápido de implementar e testar). Se no futuro precisarmos disparar vários eventos diferentes com lógica mais elaborada (retry, log de erro, agregações), evoluímos para uma Edge Function dedicada sem precisar refazer o trabalho — só trocar a URL de destino do trigger. Reaproveitando o padrão de trigger + `pg_net` já documentado em `docs/plano_notificacoes_whatsapp.md`:

```sql
CREATE OR REPLACE FUNCTION public.notify_posthog_agendamento()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://us.i.posthog.com/capture/',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'api_key', '<VITE_POSTHOG_KEY>',
      'event', 'agendamento_criado',
      'distinct_id', NEW.estabelecimento_id::text,
      'properties', jsonb_build_object(
        'origem', NEW.origem,
        'agendamento_id', NEW.id,
        'valor_cobrado', NEW.valor_cobrado
      )
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_notify_posthog_agendamento
AFTER INSERT ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.notify_posthog_agendamento();
```

Importante: aqui o `distinct_id` usado é o **`estabelecimento_id`** (a conta/negócio), não a pessoa física da cliente final. Isso é proposital — ver Fase 5.

O mesmo padrão (trigger SQL + `net.http_post`) será reaproveitado para os eventos adicionais listados abaixo, cada um com seu próprio trigger na tabela relevante.

### Fase 4.1 — Eventos adicionais recomendados (já mapeados, fora do funil inicial)

Além dos 5 eventos do funil desenhado, vale já instrumentar estes desde o início — não fazem parte do funil de ativação, mas são sinais importantes de engajamento e monetização que vão precisar mais cedo ou mais tarde:

| Evento | Sinal que captura | Onde | Client/Server |
| :--- | :--- | :--- | :--- |
| `primeiro_cliente_cadastrado` | Ativação inicial — muitas profissionais cadastram uma cliente antes mesmo de configurar serviço/horário | [Clientes.tsx](../src/pages/profissional/Clientes.tsx), no salvamento de um novo cliente | Client |
| `link_agendamento_copiado` | Indicador de que ela pretende divulgar o link — bom preditor de quem vai receber o 1º agendamento pelo Portal | [LinkAgendamento.tsx:39](../src/pages/profissional/LinkAgendamento.tsx#L39) | Client |
| `agendamento_cancelado` | Sinal de fricção/insatisfação — vale acompanhar taxa de cancelamento por período de uso | Trigger `AFTER UPDATE` em `public.agendamentos` quando `status` muda para `cancelado` | Server |
| `assinatura_ativada` | Conversão de trial para pago — o evento de monetização mais importante do funil como um todo | Trigger `AFTER UPDATE` em `public.estabelecimentos` quando `status_assinatura` muda de `trial` para `ativo` | Server |
| `plano_upgrade` | Upgrade de básico para premium | Mesmo trigger acima, quando `plano` muda de `basico` para `premium` | Server |

Esses dois últimos (`assinatura_ativada` e `plano_upgrade`) são particularmente valiosos porque conectam o funil de ativação de uso com o funil de receita — dá pra responder "profissionais que cadastram serviço E configuram horário no primeiro dia convertem de trial para pago com mais frequência?", por exemplo.

### Fase 5 — Privacidade e LGPD
- **Só identificamos profissionais (a conta paga), nunca as clientes finais.** No evento server-side, usamos `estabelecimento_id` como `distinct_id` — não coletamos nome, telefone ou e-mail da cliente que agendou.
- **PostHog não roda no Portal do Cliente** (`/portal/...`) — sem SDK, sem cookie, sem rastreio nessas páginas.
- **Gravação de sessão:** mascarar campos que exibem dados de clientes (ex: [Clientes.tsx](../src/pages/profissional/Clientes.tsx), que mostra nome/WhatsApp/e-mail de terceiros). O PostHog permite excluir elementos específicos da gravação com a classe CSS `ph-no-capture`, ou mascarar todo o texto de uma área. Vamos aplicar isso na tabela de clientes e em qualquer campo de telefone/e-mail.
- Atualizar a Política de Privacidade do sistema para mencionar o uso de uma ferramenta de analytics de produto.

### Fase 6 — Montar o funil dentro do PostHog (sem código, direto na interface)
1. Menu **Product Analytics → Funnels → New Funnel**.
2. Adicionar as etapas na ordem: `signup_completed` → `servico_criado` → `horarios_configurados` → `agendamento_criado`.
3. Na aba **"Time to convert"**, o PostHog já mostra a mediana de tempo entre cada etapa — exatamente os "20 minutos", "2 horas", "1 dia" que você desenhou, só que calculados de verdade a partir do uso real.
4. Salvar como Dashboard e fixar isso como a visão principal a olhar semanalmente.

### Fase 7 — Gravações de sessão e heatmaps (a parte de "usabilidade")
1. Ativar **Session Recording** no projeto (grava automaticamente as sessões dos usuários identificados).
2. Usar o filtro "sessões de usuários que se cadastraram há menos de 7 dias e ainda não cadastraram serviço" para assistir exatamente aos casos onde a profissional trava no início — é o jeito mais direto de "ver o gargalo" com os próprios olhos, sem precisar interpretar números.
3. Ativar **Heatmaps** (toolbar do PostHog) nas telas de Serviços e Meus Horários pra ver onde as pessoas clicam sem sucesso.

### Fase 8 — Rotina de acompanhamento
- Semanal: olhar o funil salvo (Fase 6) e ver se a taxa de conversão entre etapas mudou.
- Quando lançar uma mudança de UX numa dessas telas (ex: a mudança que fizemos na tabela de Clientes), comparar o funil antes/depois pra validar se a mudança realmente ajudou.
- Assistir 2-3 gravações de sessão de contas novas por semana, no início, pra calibrar intuição sobre onde as pessoas travam.

---

## Custo estimado

Plano gratuito da PostHog cobre até ~1M eventos/mês e inclui session recording, heatmaps e funis sem custo adicional — deve ser suficiente por bastante tempo dado o estágio atual do produto. Não há custo de infraestrutura adicional (não precisa de servidor próprio).

## Esforço estimado

| Fase | Esforço |
| :--- | :--- |
| 0-2 (conta, SDK, identify) | ~meio dia |
| 3 (eventos de negócio client-side) | ~meio dia |
| 4 (trigger server-side do agendamento) | ~meio dia (mais rápido se reaproveitar o padrão do webhook do WhatsApp) |
| 5 (privacidade/mascaramento) | ~2h |
| 6-7 (montar funil e dashboards na interface) | ~1h, sem código |

## Decisões confirmadas
1. **Região:** PostHog Cloud **US** — menor latência a partir do Brasil; LGPD não exige hospedagem no Brasil/UE, então a escolha é só por performance.
2. **Evento server-side:** começar com trigger SQL direto (`net.http_post`), evoluindo para Edge Function dedicada mais adiante, se necessário.
3. **Eventos adicionais:** incluídos no plano (ver Fase 4.1) — `primeiro_cliente_cadastrado`, `link_agendamento_copiado`, `agendamento_cancelado`, `assinatura_ativada`, `plano_upgrade`.

## Status
Plano aprovado, aguardando sinal para início da implementação.
