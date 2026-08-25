# 🚀 RELATÓRIO DE AUTOMAÇÃO DO META ADS E VENDAS - LASHMENU

Este documento registra detalhadamente todas as configurações, scripts, integrações e decisões técnicas implementadas para a campanha de vendas e validação do **LashMenu**.

---

## 📌 1. INFORMAÇÕES DA CONTA & IDENTIFICADORES DA META

* **ID da Conta de Anúncios**: `act_1626088674941828`
* **ID do Meta Pixel**: `1042165951490026` (Nome: `lash`)
* **ID da Página do Facebook**: `1184875188046307` (Página Oficial: **Vida de Lash Designer**)
* **ID da Campanha Mestre**: `120247805503880218`
* **Domínio Oficial**: `https://lashmenu.com`

---

## 🌐 2. ESTRUTURA DE LINKS E CHECKOUTS INTEGRADOS

### Páginas de Vendas (Landing Pages):
* **LP Principal (LPB)**: `https://lashmenu.com/vendas/lpb/`
* **LP Alternativa (LPA)**: `https://lashmenu.com/vendas/lpa/`
* **Formulário de Onboarding (Pós-Venda)**: `https://lashmenu.com/vendas/form/`

### Checkouts da Cakto:
* **Plano Essencial (R$ 197,00)**: `https://pay.cakto.com.br/r76ceej_1060004`
* **Plano Custom (R$ 297,00)**: `https://pay.cakto.com.br/nnaav4y`

---

## 🎯 3. ARQUITETURA DA CAMPANHA DE ADS (ABO)

* **Nome da Campanha**: `[LASHMENU] - CAMPANHA DE VALIDAÇÃO [ABO] 🚀`
* **Tipo**: ABO (Orçamento no nível de cada Conjunto de Anúncios — R$ 20,00/dia por conjunto)
* **Status Mestre**: **`ATIVO`** (A verba é controlada pela Regra Automatizada diária).

### Conjuntos de Anúncios (AdSets):
1. **AdSet 01 — Aberto Feminino BR (20-42 anos)** *(ID: `120247805507570218`)*
   * Público amplo feminino no Brasil (Idade: 20 a 42 anos).
2. **AdSet 02 — Interesses em Estética & Cílios** *(ID: `120247805507790218`)*
   * Interesses direcionados: *Extensão de Cílios, Estética, Salão de Beleza, Cosméticos*.
3. **AdSet 03 — Empreendedoras de Beleza** *(ID: `120247805508160218`)*
   * Interesses direcionados: *Pequenas empresas, Empreendedorismo, Design de Sobrancelhas, Micropigmentação*.

---

## 🖼️ 4. CRIATIVOS E ANÚNCIOS VINCULADOS

* **Criativos Utilizados**: **10 Mídias PNG exclusivamente criadas pelo ChatGPT** (`./criativos/ChatGPT/Criativo 01-GPT.png` ... `Criativo 10-GPT.png`). *(Os criativos do Claude estão preservados na pasta `./criativos/Claude/` para testes futuros).*
* **Total de Anúncios Criados**: **30 Anúncios no total** (10 Anúncios em cada um dos 3 Conjuntos).
* **Copy & CTA**: Textos focados em autoridade, eliminação de desconto e economia de tempo no Canva, com chamada para ação apontando para `https://lashmenu.com/vendas/lpb/`.

---

## ⏰ 5. AUTOMAÇÃO DE HORÁRIOS (REGRAS AUTOMATIZADAS DA META)

A campanha utiliza as **Regras Automatizadas da Meta** para rodar diariamente nos horários de maior conversão comercial:

* **Regra 1 (`[LASHMENU] Ligar 05h`)**:
  * **Ação**: Ativar Conjuntos de Anúncios.
  * **Horário**: Todos os dias às **`05:00 AM`** (Fuso de São Paulo).
* **Regra 2 (`[LASHMENU] Pausar 23:30h`)**:
  * **Ação**: Pausar Conjuntos de Anúncios.
  * **Horário**: Todos os dias às **`23:30 PM`** (Fuso de São Paulo).

---

## 📊 6. TRACKING E RASTREAMENTO DO META PIXEL (`1042165951490026`)

* **`PageView`**: Disparado automaticamente em todas as páginas (`lpb`, `lpa`, `form`).
* **`InitiateCheckout`**: Disparado via JavaScript em todos os botões de CTA das Landing Pages no momento em que a cliente clica para ir ao checkout da Cakto.
* **`Purchase`**: Disparado na página pós-compra (`vendas/form/index.html`) com o valor de `R$ 197.00 BRL` e moeda `BRL`.

---

## 📂 7. SCRIPTS DE AUTOMAÇÃO NO REPOSITÓRIO

* `scripts/deploy_chatgpt_ads.py`: Script Python responsável por realizar o upload dos criativos em formato Multipart, criar os `adcreatives` vinculando à página `Vida de Lash Designer` e instanciar os 30 anúncios nos conjuntos da campanha.
* `scripts/build_full_campaign.py`: Script para limpeza de campanhas antigas e criação da estrutura ABO.
* `scripts/create_meta_rules.py`: Script de referência para regras da API Meta Graph v20.0.

---

## 🚀 8. INSTRUÇÕES PARA PRÓXIMOS AGENTES OU CHATS

Ao continuar este projeto em outros chats ou estações:
1. NUNCA altere os links de checkout da Cakto nem o Pixel ID sem autorização.
2. A campanha mestre e os anúncios já estão publicados e em análise no Meta Ads Manager da conta `act_1626088674941828`.
3. Para alternar ou testar os criativos do Claude, os arquivos estão salvos em `./criativos/Claude/`.
