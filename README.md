# 🌸 LashMenu — Plataforma de Catálogos Digitais de Alta Conversão

> Ecossistema unificado para Lash Designers: Catálogos digitais interativos de alto padrão, formulário de personalização instantânea e infraestrutura de vendas automatizada.

---

## 📁 Estrutura de Diretórios do Projeto

```
📁 lashmenu-vendas/
│
├── 📁 docs/                   # Central de documentação, regras e estratégia (ver docs/README.md)
│   ├── 📁 arquitetura/        # Diretrizes técnicas, isolamento de produção e Supabase
│   ├── 📁 marketing/          # Planos comerciais, automação de anúncios e funis
│   └── 📁 estrategia/         # Visão geral de produto e carreira
│
├── 📁 catalogo/               # Motor de roteamento por subdomínio e catalog-injector.js
├── 📁 classico-rose/          # Modelo Oficial: Clássico Rosé
├── 📁 classico-midnight/      # Modelo Oficial: Clássico Midnight
├── 📁 harmonia-rose/          # Modelo Oficial: Harmonia Rosé
├── 📁 harmonia-midnight/      # Modelo Oficial: Harmonia Midnight
├── 📁 glamour-rose/           # Modelo Oficial: Glamour Rosé
├── 📁 glamour-midnight/       # Modelo Oficial: Glamour Midnight
├── 📁 clientes/               # Catálogos estáticos / Ejeção VIP Concierge
├── 📁 admin/                  # Painel administrativo e editor de procedimentos
├── 📁 formulario/             # Formulário de onboarding e personalização do catálogo
├── 📁 vendas/                 # Landing pages oficiais (LPA, LPB, V0, vídeos e funis)
├── 📁 api/                    # Serverless functions (notificações e webhooks)
├── 📁 criativos/              # Mídias e criativos de marketing (ChatGPT, Claude, Vídeos)
├── 📁 scripts/                # Scripts Python de automação de campanhas Meta Ads
│
├── 📄 index.html              # Hub Operacional & Roteador Global
├── 📄 server.js               # Servidor local de desenvolvimento
├── 📄 vercel.json             # Regras de roteamento de produção
└── 📄 .gitignore
```

---

## 🛡️ Regras de Isolamento de Produção
Antes de realizar alterações no projeto, consulte o guia oficial em [`docs/arquitetura/ARQUITETURA_ISOLAMENTO_PRODUCAO.md`](file:///docs/arquitetura/ARQUITETURA_ISOLAMENTO_PRODUCAO.md).
