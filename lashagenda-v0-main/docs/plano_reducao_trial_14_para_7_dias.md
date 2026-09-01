# Plano: Reduzir o Trial de 14 para 7 dias

## Status

✅ Implementado e testado. Trial de contas novas agora é de 7 dias (confirmado em produção via conta de teste), textos de marketing/UI atualizados, limiares do `TrialBanner.tsx` ajustados e validados nos 3 estados (neutro/warning/urgent) mais bloqueio ao expirar.

## Motivação

A maioria dos concorrentes do mercado usa 7 dias de trial, não 14. A hipótese é que 14 dias facilita a procrastinação ("tenho bastante tempo, depois eu vejo") e reduz a urgência de a profissional realmente testar o produto (cadastrar serviço, configurar horário, divulgar o link, receber o primeiro agendamento). Um prazo mais curto tende a criar mais urgência genuína, sem necessariamente ser curto demais para o "aha moment" acontecer.

**Ponto de atenção**: vale acompanhar pelo Funil de Ativação já montado no PostHog (ver `docs/plano_analytics_funil_uso_implementado.md`) se o prazo de 7 dias é suficiente para a maioria completar o funil (cadastro → serviço → horário → 1º agendamento) antes de decidir definitivamente.

---

## O que de fato controla o prazo (precisa mudar no código/banco)

### 1. `scripts/schema_definitivo.sql`
- **Linha 273**: `now() + INTERVAL '14 days'`, dentro da função `handle_new_user_onboarding()` — trigger `AFTER INSERT` em `auth.users`. É aqui que o trial é definido de verdade para toda conta nova.
- Linha 266: comentário `-- 1. Criar o estabelecimento com trial de 14 dias no plano Agenda` (atualizar por consistência).
- Linha 32: coluna `trial_ends_at TIMESTAMPTZ` (sem default — preenchida pela trigger acima, nenhuma mudança estrutural necessária).

### 2. `scripts/migration_guest_booking.sql`
- **Linha 54**: a mesma função `handle_new_user_onboarding()` foi recriada nesse arquivo (`CREATE OR REPLACE FUNCTION`) com o mesmo `INTERVAL '14 days'`.
- Linha 47: mesmo comentário de trial de 14 dias.

⚠️ **Atenção crítica**: a função existe duplicada nesses dois arquivos SQL. Antes de aplicar a mudança, é preciso **confirmar diretamente no banco de produção do Supabase** qual versão de `handle_new_user_onboarding()` está ativa hoje (pode ter sido a última aplicada de um desses arquivos, ou pode ter sido editada manualmente pelo dashboard). Mudar só um dos dois arquivos e não aplicar no banco não tem efeito nenhum.

---

## Textos de marketing/UI — troca literal de "14" por "7"

Mais de 17 ocorrências em 7 arquivos `.tsx`:

| Arquivo | Linhas | O que é |
| :--- | :--- | :--- |
| `src/pages/LandingPage_OfertaUm.tsx` | 95, 273, 292, 413, 682 | FAQ, CTAs ("Testar 14 dias grátis"), badge ("14 dias grátis") |
| `src/pages/LandingPage_OfertaUm_Dark.tsx` | 97, 240, 259, 618 | mesmos textos, versão dark |
| `src/pages/LandingPage_OfertaDois.tsx` | 86, 232, 251, 733 | mesmos textos |
| `src/pages/LandingPage_OfertaDois_Dark.tsx` | 88, 234, 253, 735 | mesmos textos |
| `src/pages/LandingPage_v5.tsx` | 223, 237, 490 | CTAs e badge |
| `src/pages/LandingPage_v6.tsx` | 208, 222, 495 | CTAs e badge |
| `src/pages/profissional/CadastroProfissional.tsx` | 223 | "14 dias sem compromisso" (subtítulo abaixo de "Comece grátis agora") |
| `src/components/common/BillingGuard.tsx` | 44 | mensagem de bloqueio: "Seus 14 dias grátis acabaram. Escolha um plano pra continuar usando a agenda." |

⚠️ **Não confundir**: em `LandingPage_v5.tsx:237` e `LandingPage_v6.tsx:222` existe também um badge **"Garantia 7 dias"** — isso é garantia de reembolso da assinatura paga, **não é o trial**. Não mexer nesse texto (ele já está certo do jeito que está).

---

## O que já é dinâmico (não precisa mudar)

Esses lugares calculam tudo a partir do `trial_ends_at` vindo do banco — assim que a trigger passar a gerar 7 dias em vez de 14, eles se ajustam sozinhos, sem editar código:

- `src/pages/profissional/Faturamento.tsx` (linhas 93, 114-116, 363-372, 454-463) — `daysRemaining` calculado dinamicamente.
- `src/hooks/useSubscription.ts` (linhas 23-31) — `isSubscriptionActive()` compara `trial_ends_at` com a data atual.
- `src/contexts/AuthContext.tsx` (linhas 75, 105, 143, 155) — só lê/propaga `trial_ends_at`.

---

## Decisão pendente: limiares de urgência do `TrialBanner.tsx`

**Resolvido**: os limiares antigos (`urgent <= 3`, `warning <= 7`) foram trocados para `urgent <= 2` e `warning <= 4`, mantendo a mesma proporção do trial de 14 dias (aprox. últimos 30% = urgent, os 30% anteriores = warning). Testado e confirmado nos 3 estados (azul/laranja/vermelho) mais o bloqueio ao expirar.

---

## Documentação a atualizar por consistência (sem impacto funcional)

| Arquivo | O que menciona |
| :--- | :--- |
| `docs/PRD - Lash Agenda.md` (linhas 26, 212) | "Trial: 14 dias com acesso Premium completo" |
| `docs/processo_integracao_asaas.md` (linhas 166-172, 181) | script de teste manual simulando `trial_ends_at` de 14 dias |
| `docs/plano_migracao_asaas_producao.md` (linhas 88, 291) | menções ao trial de 14 dias no roteiro de teste |
| `docs/roadmap_producao_asaas.md` (linha 109) | "Premium Trial (14 dias)" |
| `docs/plano_notificacoes_trial.md` (linhas 8, 71, 125) | **plano não implementado** de e-mail nos dias 3 e 12 avisando expiração — se for implementado no futuro, os dias-gatilho precisam ser recalculados para um trial de 7 dias (ex: dia 5 avisando que faltam 2) |

---

## Checklist de implementação

1. [x] Confirmar qual versão de `handle_new_user_onboarding()` está ativa no banco de produção.
2. [x] Atualizar `INTERVAL '14 days'` → `INTERVAL '7 days'` em `scripts/schema_definitivo.sql` e `scripts/migration_guest_booking.sql` (mais um novo `scripts/migration_trial_7_dias.sql` aplicado em produção).
3. [x] Aplicar a mudança da function no Supabase (SQL Editor) e testar criando uma conta nova.
4. [x] Trocar "14" por "7" nos 8 arquivos `.tsx` listados acima (sem mexer no "Garantia 7 dias").
5. [x] Ajustar os novos limiares de `urgent`/`warning` em `TrialBanner.tsx` (`<=2` / `<=4`).
6. [x] Testar o fluxo completo: cadastro → banner de trial em diferentes estados → bloqueio ao expirar.
7. [x] Atualizar a documentação listada acima.
8. [ ] Acompanhar no PostHog (Funil de Ativação) se a mudança impacta a taxa de conversão do trial para pago — item contínuo, sem prazo definido.
