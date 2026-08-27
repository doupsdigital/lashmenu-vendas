# 📑 Estudo de Caso & Plano de Automação: Extrator de Catálogos (LashMenu VIP Concierge)

> **Histórico do Experimento:** Agosto / 2026  
> **Cliente Piloto:** Jéssica Oliveira Beauty Studio (`jessicaoliveira`)  
> **Objetivo:** Transformar catálogos brutos de clientes (PDFs, tabelas de valores ou prints de WhatsApp) em catálogos oficiais do LashMenu de forma automatizada e escalável, sem necessidade de preenchimento manual de formulários.

---

## 🎯 1. O Problema & A Oportunidade de Negócio

### A Dor Descoberta (Fricção de Onboarding)
A maioria das Lash Designers já possui algum tipo de tabela de preços ou catálogo antigo (PDF no Canva, prints no WhatsApp, imagem no Feed/Stories). Exigir que a cliente preencha um formulário extenso (digitando 6 a 12 procedimentos, preços, durações e fazendo upload de fotos uma a uma) gera abandono de compra e atrito na conversão.

### A Nova Oferta: LashMenu VIP Concierge (Ticket R$ 247 – R$ 297)
- **Proposta:** *"Não preencha nada. Apenas envie o PDF ou print da sua tabela atual e nossa equipe entrega seu catálogo pronto em até 2 horas."*
- **Margem:** Custo de processamento via IA por catálogo < R$ 0,10.

---

## 🔍 2. Dados Extraídos do Caso Real (Jéssica Oliveira)

Abaixo está o mapeamento dos dados que foram identificados e estruturados a partir dos prints enviados:

### A. Dados de Identificação & Contato
* **Nome / Studio:** Jéssica Oliveira Beauty Studio
* **Localização:** Palmeiras - Tocantins
* **WhatsApp:** `556392901610`
* **Slug Definido:** `jessicaoliveira`
* **Modelo Indicado:** Harmonia Rosé (`harmonia-rose` / Mosaico Rosé)
* **Slogan / Subheadline:** *"Seus cílios perfeitos do seu jeito!"*

### B. Procedimentos de Cílios & Preços Extraídos
1. **Clássico Fio a Fio**: Aplicação R$ 120,00 | Manut: 15d R$ 90 / 20d R$ 100 / 24d R$ 110 | Duração: 1h30
2. **Volume Brasileiro**: Aplicação R$ 130,00 | Manut: 15d R$ 90 / 20d R$ 100 / 24d R$ 120 | Duração: 1h45
3. **Volume Wisp**: Aplicação R$ 135,00 | Manut: 15d R$ 110 / 20d R$ 120 / 24d R$ 130 | Duração: 2h00
4. **Fox Eyes**: Aplicação R$ 140,00 | Manut: 15d R$ 110 / 20d R$ 120 / 24d R$ 130 | Duração: 1h45
5. **Volume Egípcio**: Aplicação R$ 140,00 | Manut: 15d R$ 90 / 20d R$ 120 / 24d R$ 130 | Duração: 1h45
6. **Volume Russo**: Aplicação R$ 180,00 | Manut: 15d R$ 110 / 20d R$ 150 / 24d R$ 170 | Duração: 2h15

### C. Procedimentos de Sobrancelhas
1. **Design de Sobrancelhas**: R$ 25,00 (45 min) — *"Essa técnica é a ideal para mulheres que desejam realçar o olhar com naturalidade e delicadeza"*
2. **Design com Henna**: R$ 45,00 (45 min) — *"Técnica ideal para mulheres que desejam um olhar marcante e sensual."*

### D. Regras de Atendimento & Políticas
* Manutenção a cada 15 a 24 dias (após 30 dias = nova aplicação).
* Mínimo de 50% dos fios remanescentes para manutenção.
* Pagamentos: Pix, Dinheiro e Cartões de Crédito/Débito (em até 2x).

---

## ⚙️ 3. Arquitetura da Automação (Como o Robô Extrator Deve Funcionar)

Para evitar desenvolvimento manual e manter o produto padronizado nas **4 telas canônicas**:

```
[ Upload do PDF / Prints ]
           │
           ▼
[ Agente LLM de Visão (Gemini Flash Vision) ]
   - Lê as imagens
   - Encaixa os dados no Schema JSON padronizado
   - Associa as técnicas aos IDs das fotos de alta resolução do LashMenu
           │
           ▼
[ Payload JSON Canônico ]
   - Insere na tabela 'orders' do Supabase
   - Insere na tabela 'order_services' do Supabase
           │
           ▼
[ Painel Admin (/admin) ]
   - Aparece como "Pendente de Revisão"
   - O administrador apenas confere os valores e clica em "Aprovar"
           │
           ▼
[ Entrega Automática via Link ]
   - https://lashmenu-vendas.vercel.app/catalogo/?slug=nomedacliente
```

### Schema JSON Canônico Esperado:
```json
{
  "client_name": "Nome da Profissional",
  "whatsapp": "55DDDNUMERO",
  "instagram": "usuario_sem_arroba",
  "location": "Cidade - UF",
  "slug": "slugunico",
  "model_id": "harmonia",
  "color_id": "rose",
  "hero_phrase": "Frase de impacto da capa",
  "services": [
    {
      "name": "Nome da Técnica",
      "category": "Extensão de Cílios | Sobrancelhas | Cuidados",
      "price": "R$ 00,00",
      "duration": "1h30",
      "maintenance": "R$ 00,00 (até 20 dias)"
    }
  ]
}
```

---

## 💡 4. Diretrizes de Produto (Para não virar serviço customizado)

1. **Fotos de Procedimentos:** Usar por padrão a biblioteca do LashMenu (`volume-brasileiro.png`, `volume-russo.png`, etc.). Deixar claro na comunicação que fotos personalizadas podem ser trocadas depois pela cliente no painel.
2. **Tela de Orientações:** Manter o layout dos 4 cards (`Confirmação`, `Pontualidade`, `Preparação`, `Pagamento/Manutenção`) apenas preenchendo os textos extraídos.
3. **Escalabilidade:** Toda criação deve alimentar o banco de dados dinâmico (`catalogo/?slug=...`), sem necessidade de criar pastas estáticas manuais no repositório.
