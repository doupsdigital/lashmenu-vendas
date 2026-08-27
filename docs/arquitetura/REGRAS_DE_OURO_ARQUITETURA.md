# 🛡️ Diretrizes de Ouro & Travas de Arquitetura — LashMenu

> **LEITURA OBRIGATÓRIA PARA QUALQUER AGENTE OU DESENVOLVEDOR NESTE REPOSITÓRIO**

---

## 🚫 REGRA Nº 1: ISOLAMENTO TOTAL ENTRE LANDING PAGE E CATÁLOGOS

O projeto LashMenu é dividido em dois ecossistemas com propósitos e ciclos de vida completamente diferentes:

1. **Ecossistema de Vendas / Landing Page (`vendas/`)**
   * Contém as páginas de vendas (`vendas/lpa/` e `vendas/lpb/`), formulário (`vendas/form/`) e assets de marketing.
   * **Objetivo:** Aquisição, conversão e demonstração interativa.

2. **Ecossistema de Catálogos Oficiais de Clientes (PRODUÇÃO VIVA)**
   * Pastas de modelos: `harmonia-rose/`, `harmonia-midnight/`, `glamour-rose/`, `glamour-midnight/`, `classico-rose/`, `classico-midnight/`, `templates/`, `catalogo/`, `clientes/`.
   * **Objetivo:** São os catálogos reais que estão nos links de bio do Instagram e WhatsApp das clientes finais.

---

## ⚠️ PROIBIÇÕES ABSOLUTAS (TRAVAS)

1. **NUNCA alterar arquivos de catálogo para ajustar o mockup da Landing Page:**
   * Se o iPhone mockup na LP precisar de escala, ajuste de zoom, esconder elementos, rolagem ou redimensionamento, a alteração **DEVE ser feita exclusivamente em `vendas/lpa/css/style.css` e `vendas/lpb/css/style.css`** (ex: classes `.testdrive-phone`, `.testdrive-screen-scaler`, ou parâmetros de URL como `?preview=catalog`).
   * **É ESTRITAMENTE PROIBIDO** alterar `height`, `min-height`, `overflow`, `@keyframes`, transições, ou seletores nos CSS dos catálogos (`harmonia-rose/css/style.css`, etc.) para resolver comportamentos da landing page.

2. **NUNCA remover ou alterar animações dos catálogos:**
   * A animação de zoom Kenburns na foto do Hero (`transition: transform 10s`) e o fade escalonado dos textos (`.anim-fade-up` com `.delay-1` até `.delay-6` ativados por `.is-visible`) são o selo de luxo e sofisticação do produto.
   * **NUNCA** adicionar regras estáticas como `.hero .anim-fade-up { opacity: 1; transform: translateY(0); }`.

3. **NUNCA sobrescrever imagens base de catálogo (`Hero.png` vs `hero.jpg`):**
   * `Hero.png`: Foto de alta resolução da profissional (Capa).
   * `hero.jpg`: Foto de ambiente/procedimento de extensão de cílios da 3ª tela (*Orientações para o seu dia*).
   * Não converta nem troque `hero.jpg` por fotos de pessoas.

4. **SEMPRE validar a integridade antes de commit/push:**
   * Antes de finalizar qualquer tarefa, execute:
   ```bash
   node scripts/check-integrity.js
   ```
