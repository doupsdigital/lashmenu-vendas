# 🛡️ Diretrizes de Arquitetura e Isolamento de Produção — LashMenu

Este documento estabelece as **Regras Rígidas de Isolamento** no repositório unificado para garantir que a experiência das clientes com catálogos em produção nunca seja afetada por desenvolvimentos ou alterações na área de vendas, landing pages ou painel administrativo.

---

## 🏛️ As Camadas do Repositório

### 🔴 Camada 1: Modelos & Produção das Clientes (Área Sagrada / Imutável)
- **Caminhos:** `catalogo/`, `classico-rose/`, `classico-midnight/`, `harmonia-rose/`, `harmonia-midnight/`, `glamour-rose/`, `glamour-midnight/`.
- **Clientes Estáticos (Ejeção VIP):** `clientes/*`.
- **Regra:** NENHUM código de teste, mockup, auto-tour, bloqueio de clique ou script experimental pode ser inserido nesta camada.
- **Injetor:** `catalogo/js/catalog-injector.js` é o motor oficial e opera exclusivamente preenchendo os dados vindos do Supabase de forma cirúrgica e segura.

---

### 🟢 Camada 2: Operação, Vendas & Gestão (Área Dinâmica)
- **Caminhos:** `vendas/`, `formulario/`, `admin/`, `index.html` (Hub Principal).
- **Regra:** Todo código de captura, checkout, formulários, PostHog, pixels e controladores de mockup da landing page residem estritamente dentro de suas respectivas pastas, sem afetar o core dos catálogos.

---

## 🔒 Regras de Ouro para Alterações

1. **Blindagem de Produção:** Alterações em landing pages ou formulários NUNCA podem modificar arquivos das Camadas 1 ou 2.
2. **Sem Poluição de Scripts:** Modelos e catálogos não devem conter listeners ou travas de preview que interfiram no funcionamento de iframes ou navegação de usuários reais.
3. **Validação de Sintaxe Pré-Commit:** Todo arquivo JavaScript deve passar por validação de integridade antes de ser enviado para produção.
4. **Consulta Prévia Obrigatória:** Qualquer necessidade de alteração estrutural no injetor ou nos modelos de produção exige alinhamento e autorização prévia.
