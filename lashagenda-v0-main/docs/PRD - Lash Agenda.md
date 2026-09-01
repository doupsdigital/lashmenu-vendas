# PRD — Lash Agenda
**Versão:** 1.1
**Data:** Julho 2026
**Status:** MVP concluído + Reestruturação de Planos (Fases 1-6) concluída

---

## 1. Visão Geral do Produto

**Lash Agenda** é um SaaS (Software as a Service) de gestão e agendamento online voltado para profissionais autônomas de cílios e estética (lash designers, designers de sobrancelhas, etc.). A plataforma elimina a dependência do WhatsApp para marcação de horários, oferecendo à profissional um painel administrativo e às clientes um portal de autoatendimento exclusivo do estúdio.

### Proposta de Valor

| Para quem | Problema resolvido | Solução |
|---|---|---|
| **Profissional** | Horas perdidas respondendo WhatsApp para agendar | Agendamento automático + portal próprio da cliente, disponível em qualquer plano |
| **Cliente final** | Dependência da disponibilidade da profissional para marcar | Portal online 24h com catálogo, datas e horários disponíveis |
| **Profissional (Premium)** | Falta de controle financeiro e clínico organizado | Relatórios do negócio, histórico detalhado e Fichas de Anamnese completas para Lash Designers |

---

## 2. Modelo de Negócio

- **Tipo:** SaaS Multi-Tenant — cada profissional é um "tenant" isolado
- **Monetização:** Assinatura mensal recorrente via Pix ou Cartão de Crédito (Asaas)
- **Trial:** 7 dias com acesso Premium completo ao se cadastrar (inclusive Fichas de Anamnese)

### Planos

O produto é vendido em dois planos. O agendamento automático — a dor principal do negócio — está disponível nos dois; o que diferencia o Premium é o pacote de CRM avançado (relatórios, histórico detalhado e fichas de anamnese profissionais).

| | Plano Agenda — R$ 59,90/mês | Plano Premium — R$ 89,90/mês |
|---|---|---|
| Cadastro de clientes e serviços | ✅ | ✅ |
| Agendamento automático + portal online da cliente | ✅ | ✅ |
| Horários dinâmicos e bloqueios de agenda | ✅ | ✅ |
| Aprovação manual ou automática de agendamentos | ✅ | ✅ |
| Suporte por e-mail | ✅ | ✅ |
| Relatórios e análises do negócio | ❌ | ✅ |
| Fichas de Anamnese completas (Lash Designers) | ❌ | ✅ |
| Histórico detalhado de atendimentos por cliente | ❌ | ✅ |
| Suporte prioritário | ❌ | ✅ |

> Sem cadeados no menu: os itens exclusivos do Premium simplesmente não aparecem para quem está no plano Agenda. O upsell acontece por um card discreto no rodapé do menu lateral, que abre um modal explicando os benefícios e leva para a tela de assinatura.

> **Nota de implementação:** o preço do Premium (R$ 89,90) já está correto no código da tela de assinatura e no gatilho de checkout, mas o redeploy da Edge Function que processa o pagamento real no Asaas foi deliberadamente adiado para o final do projeto de reestruturação (decisão do usuário — ver `docs/plano_reestruturacao_lash_agenda.md`).

---

## 3. Arquitetura do Sistema

- **Frontend:** React + TypeScript + Vite + TailwindCSS
- **Backend/DB:** Supabase (PostgreSQL + Auth + Storage)
- **Deploy:** Vercel (frontend) + Supabase (banco)
- **PWA:** Instalável como app no Android e iOS

### Ambientes

| Ambiente | Frontend | Banco |
|---|---|---|
| Desenvolvimento | `localhost` | Supabase (projeto de desenvolvimento) |
| Produção | Vercel | Supabase (projeto de produção) |

### Isolamento Multi-Tenant

Cada estabelecimento tem seus dados completamente isolados via `estabelecimento_id` em todas as tabelas + Row Level Security (RLS) no banco. Um tenant jamais acessa dados de outro.

---

## 4. Usuários do Sistema

### 4.1 Profissional (admin do estúdio)
- Se cadastra em `/cadastro` e recebe automaticamente: estabelecimento, configuração padrão e catálogo inicial de serviços
- Acessa o painel administrativo, com a extensão das funcionalidades dependendo do plano ativo
- Gerencia clientes, agenda, serviços e (no Premium) financeiro/relatórios e fichas de anamnese

### 4.2 Cliente final (cliente do estúdio)
- Acessa o portal exclusivo do estúdio via link `/portal/[slug]`
- Cria conta no portal para agendar — disponível para clientes de qualquer plano da profissional
- Visualiza catálogo, seleciona serviços, escolhe data/hora e confirma agendamento
- Gerencia seus próprios agendamentos

---

## 5. Módulos e Funcionalidades

### 5.1 Painel da Profissional

#### Tela Inicial ("Meu Estúdio")
A tela inicial é diferente por plano:

- **Plano Agenda:** saudação simples (sem badge de plano), 2 KPIs — "Aguardando Confirmação" e "Faturado Hoje" —, card de destaque "Compartilhe sua Agenda" com botão para copiar o link do portal, e a lista "Próximas clientes" com atalho para a agenda completa.
- **Plano Premium:** os mesmos elementos acima, mais o badge "PREMIUM" ao lado da saudação, 4 KPIs (Faturamento do Mês, Agendamentos Hoje, Aguardando Confirmação, Novas Clientes), grid de Ações Rápidas e o gráfico "Receita · últimos 7 dias".

#### Clientes
- Cadastro completo: nome, sobrenome, WhatsApp, e-mail, CPF, endereço, data de nascimento
- Histórico de atendimentos (manual + agendamentos concluídos + faltas) em linha do tempo, no perfil da cliente
- Indicador de faltas (no-show) no Resumo Rápido do perfil
- Busca e filtro de clientes
- No Premium, o perfil da cliente ganha um atalho direto para a Ficha de Anamnese dela (ver módulo abaixo)

#### Fichas de Anamnese — exclusivo Premium
Módulo próprio (não é mais uma aba dentro do perfil da cliente). Acessível pelo menu lateral (`/fichas-anamnese`).

- Lista de clientes com busca e indicador visual de "Ficha preenchida" ou "Ficha pendente"
- Ficha completa por cliente (`/fichas-anamnese/:id`), com:
  - **Perfil do Olho & Cílios Naturais:** formato do olho, espaçamento entre os olhos, densidade/comprimento/curvatura dos cílios naturais
  - **Preferências Técnicas:** técnica (Fio a Fio, Volume Russo, Híbrido, Volume Brasileiro, Mega Volume), mapping (Gatinho, Boneca, Esquilo, Natural, Aberto no Meio), curvatura (J/B/C/CC/D/L), espessura (0.03 a 0.20mm), comprimento predominante, efeito desejado
  - **Retenção & Cuidados:** tempo médio de retenção, frequência ideal de manutenção, tipo de adesivo, hábitos que afetam retenção (posição de dormir, maquiagem à prova d'água, exposição a calor/vapor)
  - **Histórico & Cuidados Oculares**, **Condições Clínicas & Fatores Hormonais** e **Alergias & Detalhes Clínicos** (campos clínicos que já existiam)
- Dados armazenados na coluna `anamnese_lash` (JSONB) da tabela `clientes` — sem necessidade de migração de schema para adicionar novos campos no futuro

#### Serviços
- Organização por categorias com ordem customizável
- Serviços com nome, descrição, duração e valor
- Variações por serviço (ex: Volume Russo, Clássico, Híbrido) com preço e duração próprios
- Ativação/desativação de serviços
- Serviços padrão criados automaticamente no cadastro (10 serviços em 4 categorias)

#### Agendamentos
Disponível nos dois planos.
- Visualização em calendário: Mensal, Semanal e Diária
- Criação manual de agendamentos (admin)
- Gestão de status: Pendente → Confirmado → Concluído / Cancelado / Falta
- Painel de agendamentos aguardando confirmação (ordenado por data)
- Modal de conclusão com valor recebido e registro no dashboard
- Registro de falta (no-show) com histórico no perfil da cliente
- Verificação de sobreposição de horários
- Notificação via WhatsApp (links pré-preenchidos) ao aprovar/recusar

#### Meus Horários
Disponível nos dois planos.
- Configuração de dias e horários de atendimento por dia da semana
- Bloqueios de agenda: dia inteiro ou horário específico (férias, feriados, compromissos)

#### Relatórios — exclusivo Premium
- KPIs por período (Hoje, Ontem, 7 dias, Este mês, Mês passado, Este ano, Personalizado)
- Gráficos: Receita ao longo do tempo, Agendamentos por dia da semana, Clientes novas vs recorrentes, Serviços mais realizados, Receita por categoria

#### Configurações
- Dados do negócio: nome do estúdio, Instagram, endereço, logo
- Personalização visual: paletas de cores + modo escuro/claro
- Regras de agendamento: aprovação automática ou manual, antecedência mínima para cancelamento
- Mensagem pós-agendamento personalizada

#### Minha Assinatura
- Visualização do plano ativo e status (trial, ativo, suspenso, cancelado)
- Comparativo dos dois planos lado a lado, com preços e benefícios
- Assinatura via Pix ou Cartão de Crédito, processada pelo Asaas
- Indicação de término do trial

#### Navegação
- **Desktop:** menu lateral fixo, reordenado para priorizar Agendamentos logo após a tela inicial; itens exclusivos do Premium (Relatórios, Fichas de Anamnese) só aparecem para quem tem o plano
- **Mobile:** barra inferior fixa com 5 posições — Início, Clientes, **Agenda** (botão circular em destaque, central), Serviços, Config — e o menu completo (incluindo itens Premium, Configurações, Assinatura e Suporte) é aberto pelo ícone de hambúrguer no topo

### 5.2 Portal da Cliente

#### Catálogo de Serviços
- Catálogo público com categorias, serviços, descrições, preços e durações
- Filtro por categoria
- FAQ integrado com dúvidas frequentes
- Botão "Agendar" disponível para clientes de qualquer plano da profissional

#### Agendamento Online
- Seleção de serviço e variação
- Calendário com dias disponíveis (respeita horários e bloqueios da profissional)
- Lista de horários disponíveis calculados automaticamente
- Verificação de race condition no momento da confirmação
- Status: Confirmado (aprovação automática) ou Pendente (aprovação manual)
- Mensagem personalizada pós-agendamento

#### Meus Agendamentos
- Divisão em Próximos e Passados
- Cancelamento online dentro da janela de antecedência configurada pela profissional

#### Meu Perfil
- Atualização de dados pessoais, WhatsApp, e-mail
- Upload de foto de perfil
- Alteração de senha

#### Autenticação do Portal
- Tela de login com identidade visual da plataforma (Lash Agenda)
- Cadastro com validação de e-mail único + rollback em falha
- Navegação completa (Catálogo, Agendar, Meus Agendamentos, Perfil) disponível para clientes de qualquer plano da profissional

---

## 6. Segurança

- **Row Level Security (RLS)** em todas as tabelas — isolamento completo por tenant
- **Sem `console.log`** com dados sensíveis em produção
- Todas as queries de mutação validam `estabelecimento_id` no WHERE
- Senhas gerenciadas exclusivamente pelo Supabase Auth
- `.env` com credenciais fora do controle de versão

---

## 7. PWA (Progressive Web App)

- Instalável como app no Android (banner automático) e iOS (instrução via banner customizado)
- Modo standalone (sem barra do navegador)
- Service worker network-first (sempre busca dados atualizados)
- Ícones 192×192 e 512×512
- Orientação livre (portrait e landscape)
- Atualizações de código entregues automaticamente sem reinstalação

---

## 8. Onboarding Automático

Ao se cadastrar, a profissional recebe automaticamente (via trigger no banco):
1. Estabelecimento criado com 7 dias de trial no plano Premium completo
2. Configuração padrão do negócio
3. **10 serviços prontos** em 4 categorias:
   - Extensão de Cílios (4 serviços)
   - Lash Lifting & Tratamentos (2 serviços)
   - Design de Sobrancelhas (3 serviços)
   - Manutenções e Remoções (2 serviços + 4 variações)

A profissional entra no sistema com tudo configurado para começar a usar imediatamente.

---

## 9. Logs de Auditoria

Todas as ações relevantes são registradas na tabela `logs`:
- Criação, edição e exclusão de clientes, serviços e agendamentos
- Mudanças de status de agendamentos
- Registro de conclusões e faltas
- Logs identificados com o nome real do usuário

---

## 10. Pendências (Roadmap)

| Item | Prioridade | Referência |
|---|---|---|
| Redeploy da Edge Function `asaas-checkout` com os valores/descrições atualizados (R$ 59,90 / R$ 89,90) | Alta (antes de reabrir vendas) | `docs/plano_reestruturacao_lash_agenda.md` |
| Integração real com gateway de pagamento — webhooks, renovação automática, suspensão por inadimplência | Alta | `docs/processo_integracao_asaas.md` |
| Notificações automáticas via WhatsApp (lembretes de agendamento) | Média | `docs/plano_notificacoes_whatsapp.md` |
| Ícones PWA com fundo transparente (versão branca do logo) | Baixa | — |

---

## 11. Estrutura do Projeto

```
src/
├── pages/
│   ├── profissional/     # Painel administrativo da profissional
│   │   ├── FichasAnamnese.tsx          # Lista de clientes (Premium)
│   │   └── FichaAnamneseDetalhe.tsx    # Ficha completa por cliente (Premium)
│   └── portal-clientes/  # Portal de agendamento da cliente
├── components/
│   ├── common/           # Componentes compartilhados (modais, guards, banners, UpgradeModal)
│   └── layout/           # Layouts (sidebar, header, tabbar, portal layout)
├── contexts/             # AuthContext, PortalContext
├── hooks/                # useSubscription
├── lib/                  # Cliente Supabase
├── types/                # Interfaces TypeScript
└── utils/                # Log, tema, formatações

scripts/
├── schema_definitivo.sql # Schema completo para novos bancos
└── limpar_producao.sql   # Utilitário para limpar dados de teste

docs/
├── plano_reestruturacao_lash_agenda.md  # Plano de rebranding e reestruturação de planos
├── manual_profissional.md
├── manual_cliente.md
├── plano_notificacoes_whatsapp.md
└── roadmap_producao_asaas.md
```
