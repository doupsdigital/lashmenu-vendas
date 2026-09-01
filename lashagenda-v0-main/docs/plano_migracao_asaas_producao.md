# Plano de Migração Asaas Sandbox → Produção
## Lash Agenda v03 — Pagamentos Reais

**Status:** ✅ CONCLUÍDO  
**Repositório de produção:** `doupsdigital/lashhub-v03`  
**Supabase (produção):** `vgolovxcrsxnpcecvoyi` (lashhub-prod)  
**Última atualização:** 2026-06-26  
**Concluído em:** 2026-06-26

> Este documento foi criado para ser seguido passo a passo com o Claude.
> Se você parar no meio e continuar em outra sessão, diga ao Claude:
> **"Me ajuda a continuar o plano docs/plano_migracao_asaas_producao.md"**
> e ele vai localizar exatamente onde você parou.

---

## Contexto

A integração com o Asaas está **100% implementada** com 4 Edge Functions:

| Função | O que faz |
|---|---|
| `asaas-checkout` | Cria cliente + assinatura + gera Pix ou link de cartão |
| `asaas-check-payment` | Verifica status do pagamento diretamente na Asaas (polling) |
| `asaas-cancel` | Cancela assinatura |
| `asaas-webhook` | Recebe notificações da Asaas e atualiza banco automaticamente |

A única diferença entre sandbox e produção são **2 variáveis de ambiente** no Supabase:
- `ASAAS_API_KEY` → trocar pela chave de produção
- `ASAAS_BASE_URL` → trocar de `sandbox.asaas.com` para `www.asaas.com`

Mais o registro do **webhook** no painel da Asaas apontando para a URL de produção.

---

## Checklist Geral de Progresso

- [x] **ETAPA 0** — Novo banco Supabase configurado (schema + 5 Edge Functions + secrets)
- [x] **ETAPA 0b** — Vercel já apontava para o banco correto (lashhub-prod)
- [x] **ETAPA 1** — Conta Asaas de produção verificada e API Key configurada
- [x] **ETAPA 2** — Secrets do Supabase atualizados (ASAAS_API_KEY + ASAAS_BASE_URL produção)
- [x] **ETAPA 3** — Webhook registrado no Asaas produção (lashhub-prd, Ativado)
- [x] **ETAPA 4** — Teste com Pix real: R$5 Básico ✅ e R$10 Premium ✅ — ambos ativaram via webhook
- [x] **ETAPA 5** — Cancelamento testado + estorno realizado com sucesso
- [x] **ETAPA 6** — Valores reais restaurados (R$59,90 / R$99,90). Sistema pronto para produção.

---

## ETAPA 0 — Configurar o Novo Banco Supabase (produção)

> Esta etapa configura o banco do zero: cria todas as tabelas, instala as 5 funções (Edge Functions) e define todos os secrets necessários.

### 0.1 — Anotar as credenciais do novo projeto

No painel do novo projeto Supabase:
1. **Settings → General** → copie o **Project ID** (ex: `abcdef1234567890`)
2. **Settings → API** → copie:
   - **Project URL** → `https://[PROJECT_ID].supabase.co`
   - **anon public key** → começa com `eyJ...`
   - **service_role key** → começa com `eyJ...` *(guarde com segurança — nunca expor no frontend)*

Anote aqui (preencha com seus valores reais):
```
SUPABASE_URL_PROD     = https://[PROJECT_ID].supabase.co
SUPABASE_ANON_KEY     = [anon key]
SUPABASE_SERVICE_ROLE = [service role key]
```

---

### 0.2 — Rodar o Schema no banco novo

1. No Supabase → **SQL Editor**
2. Clique em **New query**
3. Abra o arquivo `scripts/schema_definitivo.sql` do repositório
4. Copie **todo o conteúdo** e cole no editor
5. Clique em **Run** (ou Ctrl+Enter)
6. Aguarde — deve aparecer `Success. No rows returned` em verde

> ⚠️ Se aparecer erro de "extensão não encontrada", provavelmente é o `pg_net` (usado pelo trigger de notificações push). Nesse caso:
> - Supabase → **Database → Extensions**
> - Busque por `pg_net` e ative
> - Rode o schema novamente

**O que o schema cria:**
- Todas as tabelas (usuários, estabelecimentos, clientes, serviços, agendamentos, etc.)
- Todas as políticas de segurança (RLS)
- Triggers de onboarding (trial de 7 dias ao criar conta)
- Funções auxiliares (get_slots_ocupados, get_portal_profissional_info, etc.)
- Trigger de notificações push (notify_new_agendamento)

---

### 0.3 — Instalar as 5 Edge Functions

Cada função precisa ser instalada individualmente via Supabase Dashboard.

> **Como instalar cada função:**
> 1. Supabase → **Edge Functions** → **Create a new function**
> 2. Nome da função (exatamente como indicado abaixo)
> 3. Substituir o código pelo conteúdo do arquivo correspondente
> 4. Clicar em **Deploy**

#### Função 1: `asaas-checkout`
- **Nome:** `asaas-checkout`
- **Arquivo:** `supabase/functions/asaas-checkout/index.ts`
- **O que faz:** Cria cliente e assinatura no Asaas, gera QR Code Pix ou link de cartão

#### Função 2: `asaas-check-payment`
- **Nome:** `asaas-check-payment`
- **Arquivo:** `supabase/functions/asaas-check-payment/index.ts`
- **O que faz:** Verifica status de pagamento diretamente na Asaas (usado como fallback quando webhook falha)

#### Função 3: `asaas-cancel`
- **Nome:** `asaas-cancel`
- **Arquivo:** `supabase/functions/asaas-cancel/index.ts`
- **O que faz:** Cancela assinatura no Asaas e atualiza o banco

#### Função 4: `asaas-webhook`
- **Nome:** `asaas-webhook`
- **Arquivo:** `supabase/functions/asaas-webhook/index.ts`
- **O que faz:** Recebe notificações da Asaas (pagamento confirmado, vencido, cancelado) e atualiza o status da assinatura automaticamente
- ⚠️ **Importante:** esta função precisa estar com **JWT verification desabilitado** pois a Asaas chama ela externamente. Nas configurações da função no Supabase, desmarque "Require JWT authentication".

#### Função 5: `send-push`
- **Nome:** `send-push`
- **Arquivo:** `supabase/functions/send-push/index.ts`
- **O que faz:** Envia notificações push para a profissional quando uma cliente agenda pelo portal

---

### 0.4 — Configurar os Secrets das Edge Functions

Supabase → **Edge Functions** → **Secrets** → adicione cada um:

| Secret | Valor | Onde obter |
|---|---|---|
| `SUPABASE_URL` | `https://[PROJECT_ID].supabase.co` | Settings → API do novo projeto |
| `SB_SERVICE_ROLE_KEY` | service_role key | Settings → API do novo projeto |
| `ASAAS_API_KEY` | chave Asaas de produção | Ver ETAPA 1 |
| `ASAAS_BASE_URL` | `https://www.asaas.com/api/v3` | fixo |
| `ASAAS_WEBHOOK_TOKEN` | string aleatória segura | gerar (ver abaixo) |
| `WEBHOOK_SECRET` | string aleatória segura | gerar (ver abaixo) |
| `VAPID_PUBLIC_KEY` | chave pública VAPID | ver nota abaixo |
| `VAPID_PRIVATE_KEY` | chave privada VAPID | ver nota abaixo |
| `VAPID_SUBJECT` | `mailto:lashhubapp@gmail.com` | fixo |

> **Como gerar `ASAAS_WEBHOOK_TOKEN` e `WEBHOOK_SECRET`:**
> São senhas aleatórias. Pode usar qualquer gerador de senha forte (mín. 32 caracteres).
> Exemplo online: [passwordsgenerator.net](https://passwordsgenerator.net) — gere 2 senhas diferentes, uma para cada.

> **Sobre as chaves VAPID (notificações push):**
> Se quiser reutilizar as do banco antigo, peça ao Claude para recuperá-las dos logs do Supabase antigo.
> Se quiser gerar novas: Supabase → Edge Functions → qualquer função → há uma opção para gerar par VAPID, ou use [vapidkeys.com](https://vapidkeys.com).
> Importante: a `VAPID_PUBLIC_KEY` também vai no Vercel (ver ETAPA 0b).

---

## ETAPA 0b — Atualizar o Vercel com o Novo Supabase

O Vercel precisa saber as credenciais do novo banco para o frontend conectar corretamente.

1. Acesse o painel da Vercel → seu projeto
2. **Settings → Environment Variables**
3. Atualize (ou adicione) estas variáveis:

| Variável | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://[PROJECT_ID].supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | anon key do novo projeto |
| `VITE_VAPID_PUBLIC_KEY` | a mesma `VAPID_PUBLIC_KEY` configurada no Supabase |

4. Após salvar, vá em **Deployments** → clique em **Redeploy** no último deploy para aplicar as novas variáveis

> ⚠️ Sem esse passo o frontend continuará apontando para o banco antigo.

✅ Marque ETAPA 0 e 0b como concluídas antes de seguir para ETAPA 1.

---

## ETAPA 1 — Conta Asaas de Produção

### O que verificar:
1. Acesse [www.asaas.com](https://www.asaas.com) e faça login na sua conta **de produção**
   > ⚠️ Certifique-se de que é a conta de PRODUÇÃO, não o sandbox (`sandbox.asaas.com`)

2. Verifique se a conta está **homologada** (documentos aprovados):
   - Menu → **Minha Conta** → deve aparecer status de verificação OK
   - Se não estiver verificada, não conseguirá receber saques

3. Gere a **API Key de produção**:
   - Menu → **Configurações da Conta** → **Integrações** → **API**
   - Clique em **Gerar nova chave**
   - **COPIE E GUARDE COM SEGURANÇA** — é exibida só uma vez
   - Formato: começa com `$aact_` (diferente do sandbox que começa com `$aact_` também mas é outra chave)

4. Anote a chave aqui (substitua pelos valores reais):
   ```
   ASAAS_API_KEY_PRODUCAO = [COLE AQUI]
   ASAAS_BASE_URL_PRODUCAO = https://www.asaas.com/api/v3
   ```

✅ Marque ETAPA 1 como concluída quando tiver a API Key em mãos.

---

## ETAPA 2 — Atualizar Secrets no Supabase

> As Edge Functions leem essas variáveis automaticamente. Trocar aqui já muda o comportamento de todas as funções.

### Passo a passo no Supabase Dashboard:

1. Acesse [supabase.com](https://supabase.com) → seu projeto `vgolovxcrsxnpcecvoyi`
2. Menu lateral → **Edge Functions** → **Secrets**  
   _(ou: Settings → Edge Functions → Manage secrets)_

3. Localize e **edite** estas duas variáveis:

   | Variável | Valor atual (sandbox) | Novo valor (produção) |
   |---|---|---|
   | `ASAAS_API_KEY` | chave do sandbox | chave de produção gerada na ETAPA 1 |
   | `ASAAS_BASE_URL` | `https://sandbox.asaas.com/api/v3` | `https://www.asaas.com/api/v3` |

4. Após salvar, **não** é necessário fazer redeploy das funções — elas leem os secrets dinamicamente.

### Como verificar que funcionou:
- No Supabase → Edge Functions → Logs de qualquer função
- Faça uma chamada de teste pela tela de Faturamento do sistema
- Os logs devem mostrar chamadas para `www.asaas.com` (não mais `sandbox.asaas.com`)

✅ Marque ETAPA 2 como concluída.

---

## ETAPA 3 — Registrar Webhook no Asaas Produção

O webhook é o que faz o sistema atualizar o status da assinatura automaticamente quando um pagamento é recebido. **É crítico não esquecer isso.**

### URL do webhook (nossa Edge Function):
```
https://vgolovxcrsxnpcecvoyi.supabase.co/functions/v1/asaas-webhook
```

### Passo a passo no painel Asaas:
1. Login em [www.asaas.com](https://www.asaas.com)
2. Menu → **Configurações** → **Integrações** → **Webhooks**
3. Clique em **Adicionar webhook**
4. Preencha:
   - **URL:** `https://vgolovxcrsxnpcecvoyi.supabase.co/functions/v1/asaas-webhook`
   - **Token de autenticação:** (veja abaixo)
   - **Versão:** v3

5. **Sobre o Token de autenticação:**
   - Verifique qual token está configurado no Supabase Secrets como `ASAAS_WEBHOOK_TOKEN`
   - Supabase → Edge Functions → Secrets → procure `ASAAS_WEBHOOK_TOKEN`
   - Use esse mesmo valor no campo de token do Asaas
   - Se não existir, crie um token forte (ex: gere no terminal: `openssl rand -hex 32`)
   - Adicione no Supabase Secrets como `ASAAS_WEBHOOK_TOKEN` e use o mesmo no Asaas

6. **Eventos a habilitar** (marque todos estes):
   - ✅ `PAYMENT_RECEIVED` — Ativa assinatura
   - ✅ `PAYMENT_CONFIRMED` — Ativa assinatura
   - ✅ `PAYMENT_OVERDUE` — Suspende assinatura
   - ✅ `PAYMENT_DELETED` — Cancela assinatura
   - ✅ `SUBSCRIPTION_DELETED` — Cancela assinatura
   - ✅ `SUBSCRIPTION_INACTIVATED` — Cancela assinatura
   - ✅ `PAYMENT_REFUNDED` — Suspende assinatura
   - ✅ `PAYMENT_CHARGEBACK_REQUESTED` — Suspende assinatura

7. Salve e clique em **Testar** — o Asaas enviará um evento de teste para a URL

### Como verificar que o webhook funcionou:
- Supabase → Edge Functions → `asaas-webhook` → **Logs**
- Deve aparecer um log de requisição após o teste do Asaas
- Se aparecer `200 ok` nos logs = webhook está funcionando

✅ Marque ETAPA 3 como concluída.

---

## ETAPA 4 — Teste de Pagamento Real (Pix)

> ⚠️ **ATENÇÃO:** A partir daqui você vai pagar de verdade com dinheiro real.
> Estratégia: pagar o valor real (R$59,90 ou R$99,90), confirmar que tudo funciona, e depois pedir **estorno** no painel do Asaas. O estorno via Pix pode levar até 30 minutos.

### Roteiro de teste:

**1. Criar conta de profissional de teste:**
- Acesse a URL de produção: `https://lashhub.vercel.app/cadastro`
- Crie uma conta com e-mail seu (pode usar alias: `seuemail+teste@gmail.com`)
- Verifique que entrou no trial de 7 dias

**2. Fazer assinatura via Pix:**
- Painel → **Assinatura** (`/assinatura`)
- Selecione o plano desejado (Básico R$59,90 ou Premium R$99,90)
- Clique em **Pix**
- Insira seu CPF/CNPJ
- O QR Code e o código copia-e-cola aparecerão

**3. Pagar via Pix:**
- Abra o app do seu banco
- Escaneie o QR Code ou use o copia-e-cola
- Confirme o pagamento

**4. Verificar ativação:**
- No sistema, aguarde até **60 segundos**
- O status deve mudar para **"Assinatura Ativa"** automaticamente (via webhook)
- Se não mudar em 60s: verifique os logs do webhook no Supabase
- Se ainda não mudar: o polling de 10s como fallback deve detectar em até 2 minutos

**5. Verificar no banco:**
- Supabase → Table Editor → `estabelecimentos`
- Encontre o registro da conta de teste
- Verifique: `status_assinatura = 'ativo'`, `plano` correto, `billing_customer_id` e `billing_subscription_id` preenchidos

✅ Marque ETAPA 4 como concluída quando status = ativo no sistema.

---

## ETAPA 5 — Teste de Cancelamento e Estorno

### 5a. Testar cancelamento pelo sistema:
1. No painel → **Assinatura** → clique em **Cancelar assinatura**
2. Confirme o cancelamento
3. Verifique que `status_assinatura = 'cancelado'` no banco
4. Verifique que o acesso às funcionalidades premium foi bloqueado

### 5b. Fazer estorno no Asaas:
1. Acesse [www.asaas.com](https://www.asaas.com) → **Cobranças**
2. Encontre o pagamento de teste
3. Clique em **Estornar**
4. Confirme o estorno (devolverá o valor para sua conta bancária em até 30 min)
5. Após o estorno, o webhook `PAYMENT_REFUNDED` deve chegar
6. Verifique que `status_assinatura` foi atualizado para `'suspenso'`

> 💡 O cancelamento e o estorno são coisas diferentes:
> - **Cancelamento** (pelo sistema): cancela assinatura futura, mas não devolve o que já pagou
> - **Estorno** (pelo Asaas): devolve o dinheiro do pagamento realizado

✅ Marque ETAPA 5 como concluída.

---

## ETAPA 6 — Go-Live e Monitoramento

### Pré-checklist antes de abrir para o público:

- [ ] ETAPA 1 a 5 concluídas e funcionando
- [ ] Webhook testado e respondendo `200 ok`
- [ ] Valor real processado e status ativado via webhook
- [ ] Estorno realizado e status suspenso via webhook
- [ ] Logs do Supabase sem erros nas Edge Functions
- [ ] Tela de Assinatura visualmente correta (sem menção a "sandbox" ou "teste")

### O que monitorar nas primeiras 48h:
1. **Supabase → Edge Functions → Logs** — verificar se há erros nas chamadas ao Asaas
2. **Supabase → Tabela `estabelecimentos`** — verificar se status_assinatura está sendo atualizado corretamente para novos pagamentos
3. **Painel Asaas → Cobranças** — confirmação de que os pagamentos chegam e webhook está disparando

### Plano de rollback (se algo der errado):
Se o Asaas de produção apresentar problemas críticos, você pode voltar para o sandbox rapidamente:
1. Supabase → Secrets → reverter `ASAAS_API_KEY` e `ASAAS_BASE_URL` para os valores do sandbox
2. Nenhuma alteração de código é necessária — tudo é controlado pelos secrets

✅ Marque ETAPA 6 como concluída quando o sistema estiver monitorado e estável.

---

## Referência Rápida de Valores e Configurações

| Item | Valor |
|---|---|
| Plano Básico | R$ 59,90/mês |
| Plano Premium | R$ 99,90/mês |
| Detecção de plano no webhook | `valor >= 90` → Premium, senão Básico |
| URL da Edge Function (webhook) | `https://vgolovxcrsxnpcecvoyi.supabase.co/functions/v1/asaas-webhook` |
| URL Asaas Produção | `https://www.asaas.com/api/v3` |
| URL Asaas Sandbox | `https://sandbox.asaas.com/api/v3` |
| Polling interval | 10 segundos |
| Polling timeout | 15 minutos |

---

## Perguntas Frequentes

**P: Preciso criar um novo projeto no Supabase para produção?**  
R: Não é obrigatório. Você pode usar o mesmo projeto `vgolovxcrsxnpcecvoyi` — basta trocar os secrets do Asaas. Se quiser separação total entre dev e prod no futuro, pode migrar depois, mas não é necessário agora.

**P: Preciso fazer redeploy das Edge Functions após trocar os secrets?**  
R: Não. As funções leem os secrets dinamicamente a cada execução.

**P: O que acontece com os dados de teste do sandbox no banco?**  
R: Os `billing_customer_id` e `billing_subscription_id` salvos de testes no sandbox vão apontar para IDs que não existem no Asaas de produção. Isso não causa erro — simplesmente as funções de cancelamento e check vão retornar "não encontrado" para esses registros antigos. Para contas novas criadas em produção, tudo funcionará normalmente.

**P: Posso testar com um valor menor que R$59,90?**  
R: Tecnicamente não — o sistema está configurado com os valores reais dos planos. Para testar com valor pequeno, você precisaria temporariamente alterar o preço no código (não recomendado). O mais simples é pagar o valor real e fazer estorno depois.

**P: O que é o `ASAAS_WEBHOOK_TOKEN`?**  
R: É uma senha que a Asaas envia em cada requisição de webhook para provar que é ela. Nossa Edge Function verifica esse token antes de processar qualquer evento. Ele precisa ser o mesmo no Supabase Secrets e no painel da Asaas.
