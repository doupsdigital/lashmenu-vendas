# 👑 LashMenu — Documento Mestre & Guia Geral do Projeto

> **Status do Projeto:** 100% Funcional e em Produção na Vercel  
> **Repositório GitHub:** `doupsdigital/lashmenu-vendas` (Branch: `main`)  
> **Deploy de Produção:** [https://lashmenu-vendas.vercel.app/](https://lashmenu-vendas.vercel.app/)  
> **Data de Atualização:** Agosto / 2026  

---

## 📌 1. Visão Geral e Proposta de Valor

O **LashMenu** é um ecossistema digital de alta conversão desenvolvido para **Lash Designers e Studios de Extensão de Cílios**. O produto entrega um catálogo interativo premium para ser colocado no link da bio do Instagram e WhatsApp Business, permitindo que as clientes finais visualizem fotos em alta definição, preços, regras de manutenção e agendem procedimentos com 1 clique direto no WhatsApp da profissional.

---

## 🏗️ 2. Arquitetura Completa do Ecossistema

```mermaid
flowchart TD
    A[Anúncios / Tráfego Pago] --> B[Páginas de Vendas: LPB / LPA]
    B --> C[Checkout Kiwify / Cakto]
    C --> D[Formulário de Coleta: /form]
    D --> E[(Supabase DB: orders & services)]
    D --> F[Supabase Storage: catalog-assets]
    E & F --> G[Painel Admin VIP: /admin]
    G -->|Conferência & Aprovação 1-Clique| H[WhatsApp da Cliente]
    H --> I[Catálogo Oficial Publicado: /catalogo/?slug=...]
```

---

## 🌐 3. Módulos do Sistema & Links de Produção

| Módulo | Caminho no Repositório | URL de Produção | Descrição |
| :--- | :--- | :--- | :--- |
| **Hub Central** | `index.html` | [Acessar Hub](https://lashmenu-vendas.vercel.app/) | Painel inicial com os 4 acessos rápidos do negócio. |
| **LPB (Vendas Principal)** | `vendas/lpb/` | [Acessar LPB](https://lashmenu-vendas.vercel.app/vendas/lpb/) | Landing Page oficial na estética *Glamour Rosé* focada em conversão. |
| **LPA (Vendas Editorial)** | `vendas/lpa/` | [Acessar LPA](https://lashmenu-vendas.vercel.app/vendas/lpa/) | Landing Page alternativa na estética *Nude & Champagne Editorial*. |
| **Formulário Comercial** | `vendas/form/` | [Acessar Formulário](https://lashmenu-vendas.vercel.app/form) | Wizard multi-etapas para a cliente personalizar seu catálogo. |
| **Painel Admin VIP** | `admin/` | [Acessar Admin](https://lashmenu-vendas.vercel.app/admin) | Painel com PIN `1234` para revisar e aprovar catálogos com 1 clique. |
| **Roteador de Catálogos** | `catalogo/` | [Acessar Catálogo Exemplo](https://lashmenu-vendas.vercel.app/catalogo/?slug=marialuiza) | Motor multi-tenant que abre o modelo oficial com os dados da cliente. |

---

## 🎨 4. Modelos Oficiais de Catálogo (Templates Intactos)

Cada modelo possui seu próprio design, animações com **GSAP**, **ScrollTrigger**, efeito **Ken Burns** de fundo e modais bottom-sheet de luxo:

1. **Glamour Midnight** (`/glamour-midnight/`): Vitrine vertical cinematográfica com fundo escuro e acabamento dourado.
2. **Glamour Rosé** (`/glamour-rose/`): Vitrine vertical cinematográfica com fundo rosê luxuoso e texturas suaves.
3. **Harmonia Midnight** (`/harmonia-midnight/`): Grid em formato mosaico editorial com filtros de categorias.
4. **Harmonia Rosé** (`/harmonia-rose/`): Grid mosaico refinado em tons de blush e champagne.
5. **Clássico Midnight** (`/classico-midnight/`): Tipografia editorial imponente em tons escuros.
6. **Clássico Rosé** (`/classico-rose/`): Tipografia editorial refinada com estética clássica.

---

## 🗄️ 5. Banco de Dados & Storage (Supabase)

### Credenciais do Projeto Ativo:
- **Project URL:** `https://wffhptpsafllsmcsoiih.supabase.co`
- **Anon Public Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmZmhwdHBzYWZsbHNtY3NvaWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODkyMTYsImV4cCI6MjEwMjg2NTIxNn0.nwpvIwl8V6_KGIp5e5oeraAcGyt3oo8Kdam2hp6ajSQ`
- **Bucket Público:** `catalog-assets` (Pastas: `/covers/` e `/services/`)

### Estrutura das Tabelas:
1. **`orders`**:
   - `id` (UUID - Chave Primária)
   - `created_at` (Timestamp)
   - `client_name` (Nome da Lash Designer)
   - `client_email` (E-mail de compra)
   - `whatsapp` (WhatsApp com DDD)
   - `instagram` (Instagram sem @)
   - `location` (Endereço / Cidade)
   - `slug` (Subdomínio único da profissional, ex: `marialuiza`)
   - `model_id` (`glamour`, `harmonia`, `classico`)
   - `color_id` (`midnight`, `rose`)
   - `hero_phrase` (Frase de impacto na capa)
   - `cover_media_url` (URL da foto ou vídeo hospedado no Storage)
   - `cover_media_type` (`image` ou `video`)
   - `status` (`pendente_revisao` ou `aprovado`)
   - `published_url` (URL final de entrega)

2. **`order_services`**:
   - `id` (UUID)
   - `order_id` (Chave estrangeira apontando para `orders.id`)
   - `name` (Nome do procedimento)
   - `category` (Categoria / Tipo de fio)
   - `price` (Preço da aplicação)
   - `duration` (Tempo em cabine)
   - `maintenance` (Preço da manutenção)
   - `photo_url` (Foto personalizada enviada pela cliente ou foto padrão)
   - `order_index` (Ordem de exibição no catálogo)

---

## ⚡ 6. Como Funciona a Renderização Dinâmica sem Quebrar o Design

Para manter **100% da fidelidade visual e animações de cada modelo**, foi adotada a seguinte arquitetura:

1. A URL do catálogo é acessada: `/catalogo/?slug=marialuiza` ou `/c/marialuiza`.
2. O arquivo `catalogo/index.html` faz uma consulta ultra-rápida no Supabase e identifica qual modelo a cliente escolheu (ex: `glamour-rose`).
3. O navegador é direcionado para a página do modelo oficial intacto: `/glamour-rose/?slug=marialuiza`.
4. O script `catalogo/js/catalog-injector.js` roda no modelo oficial e faz a substituição cirúrgica:
   - Troca o nome e frase de capa.
   - Aplica a foto ou vídeo real.
   - Preenche os cards de procedimentos com os preços e fotos enviados.
   - Atualiza todos os botões de agendamento com o WhatsApp oficial da profissional.
   - **Todas as animações GSAP, ScrollTrigger, Ken Burns e modais continuam originais e perfeitos!**

---

## 🛡️ 7. Painel Administrativo de Revisão (`/admin`)

- **PIN de Segurança:** `1234`
- **Funcionalidades:**
  - Lista todos os pedidos em tempo real direto do banco de dados.
  - Exibe badges visuais de status (*Pendente de Revisão* e *Aprovado*).
  - **Botão `Ver Catálogo`:** Abre o catálogo gerado ao vivo em nova aba para conferência visual.
  - **Botão `Aprovar & Entregar`:** Com **1 clique**, abre o WhatsApp com mensagem VIP personalizada contendo o link pronto da cliente, e altera o status no banco para `Aprovado`.

---

## 📁 8. Mapa de Pastas do Repositório

```text
├── admin/                  # Painel Administrativo de Revisão e Entrega VIP
│   └── index.html
├── catalogo/               # Motor Multi-Tenant & Injetor Dinâmico
│   ├── index.html          # Roteador inteligente de subdomínios
│   └── js/
│       └── catalog-injector.js # Injetor cirúrgico de dados nos modelos
├── classico-midnight/      # Template Oficial Clássico Midnight
├── classico-rose/          # Template Oficial Clássico Rosé
├── glamour-midnight/       # Template Oficial Glamour Midnight
├── glamour-rose/           # Template Oficial Glamour Rosé
├── harmonia-midnight/      # Template Oficial Harmonia Midnight
├── harmonia-rose/          # Template Oficial Harmonia Rosé
├── vendas/                 # Módulo de Vendas & Onboarding
│   ├── form/               # Formulário Comercial Interativo de Coleta
│   │   ├── css/
│   │   ├── js/
│   │   │   ├── main.js
│   │   │   └── supabase-config.js # Cliente universal de upload e gravação
│   │   └── index.html
│   ├── lpa/                # Landing Page Modelo LPA
│   └── lpb/                # Landing Page Modelo LPB
├── index.html              # Hub Principal de Operações
└── vercel.json             # Regras de Roteamento e Rewrites da Vercel
```

---

## 🚀 9. Guia Rápido para Próxima Estação de Trabalho

Quando você abrir este repositório em outro computador:
1. Clone ou puxe as alterações:
   ```bash
   git pull origin main
   ```
2. Para testar localmente, basta rodar qualquer servidor HTTP simples na raiz:
   ```bash
   npx serve .
   # ou
   python -m http.server 3000
   ```
3. Todas as credenciais do Supabase e Vercel já estão devidamente configuradas nos scripts de produção.
4. Qualquer alteração enviada para o branch `main` é automaticamente publicada na Vercel em segundos.

---
*Documentação gerada e arquivada no repositório oficial LashMenu.*
