# 📁 Organização & Estrutura do Projeto — LashMenu

> Guia visual de referência rápida sobre a estrutura de pastas, hierarquia, responsabilidades e como cada módulo do ecossistema se conecta.

---

## 🌳 1. Mapa Visual da Hierarquia do Projeto

```
📁 lashmenu-vendas/
│
├── 📁 modelos/                        ─── [TODOS OS 6 MODELOS OFICIAIS CENTRALIZADOS]
│   ├── 📁 classico-rose/              ─── Modelo Clássico (Tema Rosé)
│   ├── 📁 classico-midnight/          ─── Modelo Clássico (Tema Midnight / Dark)
│   ├── 📁 harmonia-rose/              ─── Modelo Harmonia (Tema Rosé / Mosaico)
│   ├── 📁 harmonia-midnight/          ─── Modelo Harmonia (Tema Midnight / Dark)
│   ├── 📁 glamour-rose/               ─── Modelo Glamour (Tema Rosé / Editorial)
│   └── 📁 glamour-midnight/           ─── Modelo Glamour (Tema Midnight / Dark)
│
├── 📁 catalogo/                       ─── [ROTEADOR DE SUBDOMÍNIOS & MOTOR DINÂMICO]
│   ├── 📄 index.html                  ─── Roteador client-side que consulta o Supabase
│   └── 📁 js/
│       └── 📄 catalog-injector.js     ─── Motor cirúrgico de injeção de dados das clientes
│
├── 📁 clientes/                       ─── [ÁREA DE EJEÇÃO / CLIENTES VIP CONCIERGE]
│   ├── 📁 amanda-carvalho/            ─── Catálogo estático modelo Harmonia
│   ├── 📁 bruna-carvalho/             ─── Catálogo estático modelo Clássico
│   └── 📁 mariana-alves/              ─── Catálogo estático modelo Glamour
│
├── 📁 vendas/                         ─── [LANDING PAGES & FUNIS DE AQUISIÇÃO]
│   ├── 📁 lpa/                        ─── Landing Page Oficial (Variação A)
│   ├── 📁 lpb/                        ─── Landing Page Oficial (Variação B)
│   ├── 📁 v0/                         ─── Landing Page Principal com Showroom
│   ├── 📁 videos/                     ─── Página de Apresentação em Vídeo
│   └── 📁 form/                       ─── Formulário integrado ao funil de vendas
│
├── 📁 formulario/                     ─── [FORMULÁRIO DE ONBOARDING & PERSONALIZAÇÃO]
│   ├── 📄 index.html                  ─── Formulário onde a Lash cadastra seus dados e testa modelos
│   ├── 📁 css/                        ─── Estilos do formulário
│   └── 📁 js/                         ─── Validação e envio dos pedidos para o Supabase
│
├── 📁 admin/                          ─── [PAINEL ADMINISTRATIVO & EDITOR DE PROCEDIMENTOS]
│   ├── 📄 index.html                  ─── Painel geral de gestão dos catálogos
│   └── 📄 editor.html                 ─── Editor visual para ajustar dados e procedimentos
│
├── 📁 criativos/                      ─── [MÍDIAS & ASSETS DE TRÁFEGO PAGO]
│   ├── 📁 ChatGPT/                    ─── Copies e criativos gerados para testes
│   ├── 📁 Claude/                     ─── Criativos e variações de anúncios
│   └── 📁 Videos/                     ─── Vídeos de anúncios e reels para campanhas
│
├── 📁 scripts/                        ─── [SCRIPTS DE AUTOMAÇÃO & AUDITORIA TÉCNICA]
│   ├── 📄 check-integrity.js          ─── Auditor automático de integridade do código
│   └── 📄 deploy_meta_ads.py          ─── Scripts Python de automação do Meta Ads
│
├── 📁 docs/                           ─── [CENTRAL DE DOCUMENTAÇÃO & DIRETRIZES]
│   ├── 📁 arquitetura/                ─── Regras de isolamento, Supabase e não-regressão
│   ├── 📁 marketing/                  ─── Planos comerciais, anúncios e funis
│   ├── 📁 estrategia/                 ─── Visão geral do negócio e roadmap de produto
│   ├── 📄 ORGANIZACAO_DO_PROJETO.md   ─── Este guia visual de estrutura
│   └── 📄 README.md                   ─── Sumário de links rápidos
│
├── 📁 api/                            ─── [FUNÇÕES SERVERLESS & INTEGRAÇÕES]
│   └── 📄 telegram.js                 ─── Webhook para notificações de novos pedidos no Telegram
│
├── 📄 index.html                      ─── [HUB PRINCIPAL & ROTEADOR GLOBAL]
├── 📄 server.js                       ─── [SERVIDOR LOCAL DE DESENVOLVIMENTO]
├── 📄 vercel.json                     ─── [REGRAS DE ROTEAMENTO & DEPLOY NA VERCEL]
├── 📄 README.md                       ─── [APRESENTAÇÃO MASTER DO PROJETO]
└── 📄 .gitignore                      ─── [ARQUIVOS IGNORADOS PELO GIT]
```

---

## 🧭 2. Dicionário de Responsabilidades das Pastas

| Pasta | Para que serve? | Pode mexer com frequência? |
| :--- | :--- | :--- |
| **`modelos/`** | Contém os 6 modelos de catálogo que as clientes usam. É a **Área Sagrada** de produção. | ⚠️ **Somente com muito cuidado** e validação prévia. |
| **`catalogo/`** | É o motor que busca os dados no Supabase e injeta no catálogo da cliente. | ⚠️ **Área Crítica**. Mudanças aqui afetam todas as clientes ativas. |
| **`clientes/`** | Pastas de catálogos estáticos manuais (quando uma cliente pede algo customizado fora do banco). | ✅ Livre para criar novas pastas de clientes especiais. |
| **`vendas/`** | Todas as Landing Pages, mockups interativos, funis e testes A/B de vendas. | ✅ Livre para evoluções de marketing e design. |
| **`formulario/`** | Onde a cliente preenche o nome, fotos, procedimentos e escolhe o modelo. | ✅ Livre para melhorias no fluxo de onboarding. |
| **`admin/`** | O painel onde você gerencia pedidos, edita clientes e altera procedimentos. | ✅ Livre para melhorias no painel administrativo. |
| **`criativos/`** | Repositório de imagens, vídeos e copies para rodar tráfego pago. | ✅ Livre para adicionar novas mídias. |
| **`scripts/`** | Automações em Python (anúncios Meta Ads) e scripts de integridade Node.js. | ✅ Livre para scripts de suporte e auditoria. |
| **`docs/`** | Toda a memória do projeto, regras de ouro, estratégias e arquitetura. | ✅ Livre para registrar novos passos e diretrizes. |
| **`api/`** | Notificações de novos leads/pedidos no Telegram e integrações de checkout. | ⚠️ Mexer apenas ao integrar novos webhooks. |

---

## 🎛️ 3. O Que São os Arquivos na Raiz?

1. **`index.html` (Hub Principal & Roteador):**
   - Se acessado direto em `lashmenu.com` ou localmente, abre o **Hub de Operação** com links para todas as ferramentas.
   - Se acessado por um subdomínio (ex: `jessica.lashmenu.com`), detecta o subdomínio e encaminha imediatamente para o catálogo da cliente.
2. **`server.js`:**
   - Servidor local Node.js para você rodar `node server.js` e testar tudo na sua máquina.
3. **`vercel.json`:**
   - O arquivo de regras da nuvem. Garante que rotas como `/admin`, `/formulario`, `/c/:slug` e `/modelos/:modelo` funcionem instantaneamente sem erro 404.
4. **`README.md`:**
   - A vitrine do repositório no GitHub.

---

## 🔄 4. Como as Pastas Conversam Entre Si (Fluxo de Dados)

```
                       [ CLIENTE ACESSA O LINK ]
                                   │
                                   ▼
                   subdominio.lashmenu.com / index.html
                                   │
                                   ▼
                            📁 catalogo/
                 (Busca dados do pedido no Supabase)
                                   │
                                   ▼
                       📁 modelos/${modelo_escolhido}/
                   (Injeta dados reais sem alterar o HTML base)
                                   │
                                   ▼
                   [ CATÁLOGO CARREGADO PERFEITO ]
```

---

## 🛡️ 5. Regra de Ouro para Novas Tarefas

Sempre que formos iniciar um novo pedido ou evolução:
- **Se for Vendas/Marketing:** Trabalhamos dentro de `vendas/` ou `formulario/`.
- **Se for Painel:** Trabalhamos dentro de `admin/`.
- **Se for Documentação:** Salvamos dentro de `docs/`.
- **Se for nos Catálogos/Modelos:** Sempre revisamos o impacto em produção antes de alterar qualquer linha em `modelos/` ou `catalogo/`.
