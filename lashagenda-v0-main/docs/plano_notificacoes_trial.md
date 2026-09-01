# Plano: Notificações Automáticas de Trial por E-mail

> ⚠️ **Atenção**: este plano nunca foi implementado (ver `docs/plano_reducao_trial_14_para_7_dias.md`). Os dias "3" e "12" abaixo foram pensados para um trial de **14 dias**, que já não é mais o valor real do sistema (o trial atual é de **7 dias**). Se este plano for retomado no futuro, recalcular os dias-gatilho proporcionalmente antes de implementar.

## Objetivo

Disparar e-mails automáticos para profissionais durante o período de testes:

- **Dia 3**: E-mail de boas-vindas + pergunta se precisa de ajuda para configurar
- **Dia 12**: E-mail de urgência avisando que o trial expira em 2 dias (pensado para trial de 14 dias — recalcular se implementar com o trial atual de 7 dias)

---

## Stack escolhida

| Componente | Ferramenta | Motivo |
|---|---|---|
| Envio de e-mail | **Resend** | Gratuito até 3.000/mês, SDK simples, excelente deliverability |
| Cron / agendamento | **Supabase pg_cron** | Já incluso no Supabase, roda SQL/Edge Functions diariamente |
| Lógica de envio | **Supabase Edge Function** | Acesso ao banco com service role, sem expor credenciais |
| Rastreamento | Colunas na tabela `estabelecimentos` | Evita reenvio |

---

## Alterações necessárias no banco

### 1. Adicionar colunas de controle na tabela `estabelecimentos`

```sql
ALTER TABLE public.estabelecimentos
  ADD COLUMN IF NOT EXISTS trial_day3_notified_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_day12_notified_at TIMESTAMPTZ;
```

> Quando `NULL`: notificação ainda não enviada.
> Quando preenchida: já foi enviada — não reenvia.

### 2. Criar extensão pg_cron (se ainda não ativada)

No Supabase Dashboard → Database → Extensions → ativar **pg_cron**.

### 3. Criar o job agendado

```sql
SELECT cron.schedule(
  'trial-email-notifications',   -- nome do job
  '0 9 * * *',                   -- todo dia às 09:00 UTC (06:00 Brasília)
  $$
    SELECT net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/trial-notifications',
      headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>", "Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);
```

---

## Edge Function: `trial-notifications`

**Arquivo:** `supabase/functions/trial-notifications/index.ts`

### Lógica

```
1. Buscar todos os estabelecimentos com status_assinatura = 'trial'
2. Para cada um:
   a. Calcular dias desde created_at (dia do trial)
   b. Se dia >= 3 E trial_day3_notified_at IS NULL:
      → Enviar e-mail de onboarding
      → Atualizar trial_day3_notified_at = NOW()
   c. Se dia >= 12 E trial_day12_notified_at IS NULL E trial_ends_at > NOW():
      → Enviar e-mail de urgência
      → Atualizar trial_day12_notified_at = NOW()
```

### Estrutura do arquivo

```typescript
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const resend = new Resend(Deno.env.get('RESEND_API_KEY')!)

Deno.serve(async () => {
  // 1. Buscar trials ativos
  const { data: estabelecimentos } = await supabase
    .from('estabelecimentos')
    .select(`
      id, nome_negocio, created_at, trial_ends_at,
      trial_day3_notified_at, trial_day12_notified_at,
      usuarios!inner(email, nome)
    `)
    .eq('status_assinatura', 'trial')
    .eq('usuarios.role', 'profissional')

  for (const est of estabelecimentos ?? []) {
    const diasDeTrial = Math.floor(
      (Date.now() - new Date(est.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )

    // Dia 3 — onboarding
    if (diasDeTrial >= 3 && !est.trial_day3_notified_at) {
      await resend.emails.send({
        from: 'Lash Agenda <contato@lashhub.com.br>',
        to: est.usuarios[0].email,
        subject: 'Como está indo sua configuração? 💜',
        html: emailDia3(est.usuarios[0].nome, est.nome_negocio)
      })
      await supabase
        .from('estabelecimentos')
        .update({ trial_day3_notified_at: new Date().toISOString() })
        .eq('id', est.id)
    }

    // Dia 12 — urgência
    const trialNaoExpirou = est.trial_ends_at
      ? new Date(est.trial_ends_at) > new Date()
      : true

    if (diasDeTrial >= 12 && !est.trial_day12_notified_at && trialNaoExpirou) {
      await resend.emails.send({
        from: 'Lash Agenda <contato@lashhub.com.br>',
        to: est.usuarios[0].email,
        subject: 'Seu teste grátis expira em 2 dias ⏳',
        html: emailDia12(est.usuarios[0].nome, est.nome_negocio, est.trial_ends_at)
      })
      await supabase
        .from('estabelecimentos')
        .update({ trial_day12_notified_at: new Date().toISOString() })
        .eq('id', est.id)
    }
  }

  return new Response(JSON.stringify({ ok: true }))
})
```

---

## Templates de e-mail

### E-mail Dia 3 — Onboarding

**Assunto:** `Como está indo sua configuração? 💜`

**Corpo:**
> Olá, [Nome]!
>
> Já faz 3 dias que você criou o **[Nome do Estúdio]** no Lash Agenda. Estamos felizes em te ter aqui!
>
> Você já conseguiu configurar seus serviços, horários e testar o portal das clientes?
>
> Se tiver alguma dúvida ou precisar de ajuda com qualquer etapa, basta responder este e-mail — estamos aqui para te ajudar.
>
> 🔗 [Acessar meu painel]
>
> Um abraço,
> Equipe Lash Agenda

---

### E-mail Dia 12 — Urgência

**Assunto:** `Seu teste grátis expira em 2 dias ⏳`

**Corpo:**
> Olá, [Nome]!
>
> Seu período de testes do **[Nome do Estúdio]** no Lash Agenda encerra no dia **[Data]**.
>
> Para continuar usando o sistema sem interrupções — e não perder seus dados de clientes e agendamentos — escolha um plano antes dessa data.
>
> ✅ Plano Básico (CRM): R$ 59,90/mês
> ✅ Plano Premium (Agenda Online): R$ 99,90/mês
>
> 👉 [Assinar agora]
>
> Qualquer dúvida, estamos à disposição.
>
> Equipe Lash Agenda

---

## Variáveis de ambiente necessárias

| Variável | Onde configurar | Valor |
|---|---|---|
| `RESEND_API_KEY` | Supabase Edge Function Secrets | Chave gerada no painel do Resend |
| `SUPABASE_URL` | Automático no Supabase | — |
| `SUPABASE_SERVICE_ROLE_KEY` | Automático no Supabase | — |

---

## Checklist de implementação

- [ ] Criar conta no Resend e verificar domínio de envio (`lashhub.com.br`)
- [ ] Gerar `RESEND_API_KEY` e salvar nos secrets da Edge Function
- [ ] Rodar o SQL para adicionar as colunas `trial_day3_notified_at` e `trial_day12_notified_at`
- [ ] Ativar a extensão `pg_cron` no Supabase
- [ ] Criar e fazer deploy da Edge Function `trial-notifications`
- [ ] Criar o job no pg_cron apontando para a Edge Function
- [ ] Testar manualmente chamando a Edge Function com um trial em dia 3 e dia 12
- [ ] Verificar e-mails recebidos e ajustar templates se necessário
- [ ] Monitorar os primeiros disparos reais

---

## Estimativa de custo

| Item | Custo |
|---|---|
| Resend (até 3.000 e-mails/mês) | **Gratuito** |
| Supabase pg_cron | **Incluso** no plano Pro |
| Supabase Edge Functions | **Incluso** (500k invocações/mês grátis) |
| **Total** | **R$ 0,00** para o volume inicial |

---

## Observações

- A Edge Function usa `SUPABASE_SERVICE_ROLE_KEY` para bypassar RLS — **nunca expor no frontend**
- O job roda às 09:00 UTC = 06:00 horário de Brasília. Ajustar para `'0 12 * * *'` (09:00 Brasília) se preferir
- Para WhatsApp: ver `plano_notificacoes_whatsapp.md` — requer aprovação de templates na Meta, implementar só após validação do produto
