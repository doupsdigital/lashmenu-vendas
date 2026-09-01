# Plano de Implementação: Evolução do LashMenu com Agendamento Nativo (Core Agendamento)

**Status:** Aguardando Aprovação do Usuário  
**Objetivo:** Evoluir o **LashMenu** incorporando o motor de agendamento automático validado no **LashAgenda**, transformando o LashMenu em um ecossistema único (Catálogo + Agenda em Tempo Real) com **ZERO impacto** na produção atual (`lashmenu.com`).

---

## 🛑 Diretriz de Segurança Zero Impacto (Isolamento Total)

Todo o desenvolvimento e teste desta evolução serão realizados em um **ambiente de testes totalmente isolado**:

1. **Git Branch Dedicada:** `feature/lashmenu-agendamento` (a branch `main` de produção permanece 100% intocada).
2. **Banco de Dados Isolado:** Novo projeto Supabase de Desenvolvimento (`Supabase Dev`). Nenhuma consulta ou escrita tocará no banco de produção.
3. **Link de Teste Online (Vercel Preview):** A Vercel gerará automaticamente uma URL exclusiva de testes (`catalogo-lash-git-feature...vercel.app` ou `dev.lashmenu.com`) conectada ao banco de testes.
4. **Feature Flag (`agendamento_ativo`):** No banco de dados, o agendamento só estará visível para contas que estiverem explicitamente ativadas (`agendamento_ativo = true`). Catálogos tradicionais continuarão direcionando para o WhatsApp como fazem hoje.

---

## 📐 Arquitetura da Solução Unificada

```
+-----------------------------------------------------------------------------------+
|                                  LASHMENU UNIFICADO                               |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [ FRONT-END CLIENTE FINAL ]                                                      |
|  Catálogo Digital (Design Responsivo & Temas)                                    |
|    └─► Botão "Agendar Horário"                                                    |
|          ├─► Se agendamento_ativo == false: Link direto WhatsApp (Legado)          |
|          └─► Se agendamento_ativo == true: Modal de Agendamento em Tempo Real    |
|                ├─ 1. Escolha de Data (Calendário)                                 |
|                ├─ 2. Grade de Horários Livres (Calculados automaticamente)        |
|                ├─ 3. Identificação Rápida (Nome + WhatsApp - Sem Senha)           |
|                └─ 4. Confirmação + Notificação WhatsApp                           |
|                                                                                   |
|  [ PAINEL ADMIN PROFISSIONAL (PWA) ]                                             |
|  Gerenciador do Estúdio (Celular/Desktop)                                         |
|    ├─ Gerenciador de Catálogo e Fotos                                             |
|    ├─ Minha Agenda (Visualização diária/semanal de agendamentos)                  |
|    └─ Configuração de Horários de Atendimento & Bloqueios/Folgas                  |
|                                                                                   |
|  [ BACKEND / DATABASE (SUPABASE UNIFICADO) ]                                      |
|    ├─ Tabela: clientes (Lash Designers donas do catálogo/agenda)                  |
|    ├─ Tabela: servicos (Duração em minutos + preço + categoria)                   |
|    ├─ Tabela: horarios_atendimento (Grade semanal da profissional)                |
|    ├─ Tabela: bloqueios_agenda (Folgas, férias e horários bloqueados)             |
|    └─ Tabela: agendamentos (Reservas efetuadas + status)                          |
+-----------------------------------------------------------------------------------+
```

---

## 🚀 Etapas de Implementação Testáveis

---

### ETAPA 1: Preparação do Ambiente de Isolamento & Staging
**Objetivo:** Garantir que o ambiente de testes esteja 100% configurado antes de qualquer alteração de código.

- [ ] **Etapa 1.1:** Criar a branch Git `feature/lashmenu-agendamento`.
- [ ] **Etapa 1.2:** Configurar o novo projeto no Supabase (`Supabase Dev`) e obter as credenciais (`SUPABASE_URL_DEV` e `SUPABASE_ANON_KEY_DEV`).
- [ ] **Etapa 1.3:** Criar arquivo `.env.development` apontando para o Supabase Dev.
- [ ] **Etapa 1.4:** Configurar a Vercel para implantar a branch `feature/lashmenu-agendamento` em ambiente de Preview conectado às variáveis de ambiente de Dev.

> **Critério de Aceite da Etapa 1:** Acessar o link da Vercel Preview, confirmar que ele carrega o LashMenu e está apontando exclusivamente para o banco de desenvolvimento.

---

### ETAPA 2: Consolidação do Schema do Banco de Dados (Supabase Dev)
**Objetivo:** Unificar a estrutura de tabelas do LashMenu com o motor de agendamento do LashAgenda no banco de desenvolvimento.

- [ ] **Etapa 2.1:** Executar script SQL de unificação de schemas no Supabase Dev:
  - Tabela `clientes_lashmenu` / `estabelecimentos` (adicionar coluna `agendamento_ativo: boolean default false`).
  - Tabela `servicos` (garantir presença dos campos `duracao_minutos: integer`, `valor: numeric`, `categoria_id`, `ativo: boolean`).
  - Tabela `horarios_atendimento` (`id`, `cliente_id`, `dia_semana`, `hora_inicio`, `hora_fim`).
  - Tabela `bloqueios_agenda` (`id`, `cliente_id`, `data_inicio`, `data_fim`, `dia_inteiro`, `hora_inicio`, `hora_fim`, `motivo`).
  - Tabela `agendamentos` (`id`, `cliente_id`, `servico_id`, `nome_cliente_final`, `whatsapp_cliente_final`, `data_hora`, `duracao_minutos`, `status: pendente|confirmado|cancelado|concluido|falta`, `observacoes`).
- [ ] **Etapa 2.2:** Configurar políticas de RLS (Row Level Security) para segurança Multi-Tenant.
- [ ] **Etapa 2.3:** Criar Trigger SQL de onboarding (ao cadastrar nova Lash, gera horários padrão de Segunda a Sexta das 08:00 às 18:00).

> **Critério de Aceite da Etapa 2:** Inserir dados de teste via painel do Supabase Dev e validar a integridade de todas as tabelas e relacionamentos.

---

### ETAPA 3: Algoritmo do Motor de Agendamento (Cálculo de Disponibilidade)
**Objetivo:** Adaptar o algoritmo testado do LashAgenda para calcular com precisão milimétrica os horários livres no LashMenu.

- [ ] **Etapa 3.1:** Criar utilitário `scheduling-engine.js` responsável pelo cálculo de horários livres:
  - *Passo 1:* Identificar o dia da semana da data escolhida e verificar se a profissional atende no dia (`horarios_atendimento`).
  - *Passo 2:* Verificar se a data possui bloqueios parciais ou de dia inteiro (`bloqueios_agenda`).
  - *Passo 3:* Buscar agendamentos existentes no dia com status ativo (`pendente` ou `confirmado`).
  - *Passo 4:* Gerar grade de slots (ex: a cada 30 min), testando a regra: `hora_slot + duracao_servico <= hora_fim_expediente` e sem colidir com nenhum agendamento ou bloqueio existente.
- [ ] **Etapa 3.2:** Implementar trava contra *Race Condition* (duplo agendamento simultâneo) diretamente na gravação do Supabase.

> **Critério de Aceite da Etapa 3:** Criar testes unitários/de integração no console simulando diferentes cenários (serviço de 2h, serviço de 45min, dia com bloqueio de almoço, dia com agendamento existente) e verificar se a lista de horários retornada está perfeita.

---

### ETAPA 4: Interface do Cliente Final (Modal de Agendamento no Catálogo)
**Objetivo:** Integrar o fluxo de agendamento diretamente no catálogo do LashMenu com adaptação aos temas visuais existentes.

- [ ] **Etapa 4.1:** Atualizar a lógica do botão "Agendar" no LashMenu (`catalogo/js/app.js`):
  - Se `agendamento_ativo === false` ➔ Abre o link do WhatsApp (comportamento atual mantido 100%).
  - Se `agendamento_ativo === true` ➔ Dispara o Modal de Agendamento Nativo.
- [ ] **Etapa 4.2:** Construir o Modal/Drawer de Agendamento Responsivo:
  - **Passo 1 (Data):** Calendário minimalista para seleção do dia (dias sem atendimento desativados).
  - **Passo 2 (Horário):** Grid de pílulas interativas com os horários disponíveis retornados pelo motor.
  - **Passo 3 (Identificação):** Formulário simples (Nome Completo + WhatsApp com máscara + Observação opcional).
  - **Passo 4 (Confirmação):** Resumo do agendamento + Botão "Confirmar Agendamento".
- [ ] **Etapa 4.3:** Estilização Dinâmica por Tema:
  - Garantir que o modal herde as variáveis de cor e estilo do tema ativo do catálogo (`Harmonia Rose`, `Midnight`, `Classico Rose`, `Glamour Rose`).
- [ ] **Etapa 4.4:** Tela de Sucesso & Gatilho de WhatsApp:
  - Exibir comprovante de agendamento e botão "Notificar no WhatsApp da Profissional" pré-preenchido.

> **Critério de Aceite da Etapa 4:** Abrir o catálogo no Vercel Preview (mobile e desktop), selecionar um serviço, escolher data/hora, preencher nome e concluir o agendamento sem nenhum erro de UI/UX.

---

### ETAPA 5: Painel Administrativo da Lash Designer (Admin + Agenda PWA)
**Objetivo:** Dar à Lash Designer o controle total sobre seus horários, bloqueios e agendamentos recebidos no próprio Admin do LashMenu.

- [ ] **Etapa 5.1:** Adicionar aba **"Minha Agenda"** no painel Admin do LashMenu (`admin/index.html`):
  - Listagem de agendamentos por dia/semana.
  - Filtro por status (`Todos`, `Pendentes`, `Confirmados`, `Concluídos`, `Cancelados`).
  - Ações rápidas: Aprovar agendamento, Concluir atendimento, Registrar falta (no-show), Cancelar.
  - Botão "Novo Agendamento Manual" (para a Lash agendar clientes presencialmente).
- [ ] **Etapa 5.2:** Adicionar aba **"Horários & Bloqueios"**:
  - Configuração de horário de atendimento por dia da semana (ex: Seg-Sex 08:00 às 18:00, Sáb 08:00 às 12:00, Dom Fechado).
  - Formulário para adicionar Bloqueios de Agenda (ex: Folga dia 15/09 o dia todo, ou Médico dia 20/09 das 14:00 às 16:00).
- [ ] **Etapa 5.3:** Ajustar a edição de Serviços no Admin:
  - Adicionar o campo "Duração estimada do serviço (minutos)" na criação/edição de serviços do catálogo.

> **Critério de Aceite da Etapa 5:** Logar no Admin do LashMenu em ambiente Dev, configurar horários de trabalho, adicionar um bloqueio de folga e verificar que esse horário bloqueado sumiu imediatamente do catálogo público da cliente.

---

### ETAPA 6: Suporte PWA e Notificações no Celular
**Objetivo:** Garantir que o painel admin continue 100% funcional como um App no celular da Lash Designer.

- [ ] **Etapa 6.1:** Atualizar o `manifest.json` e Service Worker do LashMenu para incluir as novas rotas da Agenda.
- [ ] **Etapa 6.2:** Testar instalação do PWA no Android e iOS (modo standalone).

> **Critério de Aceite da Etapa 6:** Instalar o PWA no celular a partir do link de Preview da Vercel, abrir o aplicativo e gerenciar a agenda com navegação fluida sem barras de navegador.

---

### ETAPA 7: Testes Integrados, Validação de Segurança & UX
**Objetivo:** Testar todos os cenários possíveis de uso e erro antes de considerar o sistema pronto para produção.

- [ ] **Etapa 7.1:** Teste de Regressão do LashMenu Tradicional:
  - Garantir que todas as contas ativas sem agendamento continuam funcionando exatamente como antes.
- [ ] **Etapa 7.2:** Teste de Estresse de Agendamento:
  - Simular dois agendamentos simultâneos para o mesmo horário e garantir que o segundo é bloqueado elegantemente.
- [ ] **Etapa 7.3:** Validação em múltiplos dispositivos mobile (iPhone iOS Safari e Android Chrome).

> **Critério de Aceite da Etapa 7:** Aprovação completa de todos os itens do checklist de teste por parte do usuário.

---

### ETAPA 8: Estratégia de Migração & Rollout em Produção
**Objetivo:** Migrar o sistema evoluído para o domínio `lashmenu.com` com ZERO downtime e ZERO risco.

- [ ] **Etapa 8.1:** Aplicar a nova estrutura de tabelas (migrations) no Supabase de Produção.
- [ ] **Etapa 8.2:** Realizar o Merge da branch `feature/lashmenu-agendamento` para a branch `main` no GitHub.
- [ ] **Etapa 8.3:** Acompanhar o deploy automático da Vercel no domínio `lashmenu.com`.
- [ ] **Etapa 8.4:** Ativar o agendamento (`agendamento_ativo = true`) inicialmente para a conta de teste do usuário e realizar uma validação final em ambiente real.

---

## ❓ Questões para Revisão do Usuário

1. **Campos do Agendamento:** Nome + WhatsApp é suficiente no momento da confirmação pelo cliente final, ou gostaria de pedir algum campo extra (como e-mail)? *(Recomendado manter apenas Nome + WhatsApp para minimizar atrito).*
2. **Intervalo padrão de horários:** O cálculo de horários vagos deve exibir opções a cada 30 minutos (ex: 08:00, 08:30, 09:00...) ou a cada 1 hora? *(Recomendado 30 minutos).*
3. **Notificação:** Na confirmação do agendamento, a cliente terá o botão para notificar a Lash via WhatsApp. Queremos adicionar futuramente integração com API automática de mensagens (ex: Evolution API / Z-API) ou o disparo via link de WhatsApp atende perfeitamente nesta primeira fase?
