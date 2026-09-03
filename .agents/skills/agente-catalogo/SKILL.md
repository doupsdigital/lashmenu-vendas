---
name: agente-catalogo
description: Agente autônomo para criação e publicação de catálogos LashMenu no Supabase e Painel Admin a partir de prints, fotos de capa e listas de serviços enviados pelo usuário.
---

# 🌸 Agente Criador de Catálogos LashMenu VIP

Esta Skill capacita você a transformar dados brutos de clientes (prints de WhatsApp, fotos de listas de preços, fotos de capa, tabelas ou mensagens de texto) em **catálogos digitais completos e interativos no Supabase**, disponibilizando-os instantaneamente no Painel Admin para conferência e aprovação.

---

## 🎯 Quando Ativar Esta Skill

Ative e siga este protocolo sempre que o usuário disser comandos como:
- *"Use o agente pra criar o catálogo dessa cliente"*
- *"Crie o catálogo com essa foto de capa e essa lista"*
- *"Cadastre essa cliente no LashMenu"*
- Ou quando o usuário fornecer imagens/prints de procedimentos acompanhados de uma foto de perfil/capa.

---

## ⚙️ Fluxo Operacional Passo a Passo

### 1. Extração Multimodal Inteligente (OCR & Visão)
Ao receber um print, imagem ou texto com a lista de procedimentos:
1. **Identifique a Cliente:**
   - Nome da Lash Designer / Studio
   - WhatsApp de atendimento (formato com DDD)
   - Instagram (se mencionado)
   - Cidade / Bairro (se mencionado)
2. **Identifique o Modelo e Cor Solicitados:**
   - Modelos: `glamour`, `harmonia`, `classico`, `mosaico` (Padrão: `harmonia` ou `glamour`)
   - Paletas: `rose`, `midnight` (Padrão: `rose` ou `midnight`)
3. **Extraia a Lista de Procedimentos:**
   - Nome do procedimento
   - Preço de aplicação (ex: `130,00` ou `R$ 130`)
   - Duração (ex: `1h30`, `1h45`, `2h00`)
   - Manutenção (ex: `90,00 até 20 dias`, `15d R$ 80 / 20d R$ 100`)

---

### 2. Mapeamento Inteligente (De-Para Canônico)
Conecte o serviço enviado ao procedimento oficial do LashMenu para aproveitar automaticamente as fotos em alta resolução e as descrições técnicas persuasivas:

| Termo enviado no Print / Texto | Procedimento Oficial Associado | Foto Oficial Vinculada |
| :--- | :--- | :--- |
| "Brasileiro", "Vol. Brasileiro", "Fios em Y" | **Volume Brasileiro** | `/modelos/glamour-midnight/assets/img/volume-brasileiro.png` |
| "Fio a Fio", "Clássico", "Efeito Rímel" | **Clássico Fio a Fio** | `/modelos/glamour-midnight/assets/img/classico-fio-a-fio.png` |
| "Egípcio", "Fios W", "Volume 3D W" | **Volume Egípcio** | `/modelos/glamour-midnight/assets/img/volume-egipcio.png` |
| "Híbrido", "Misturado", "Mix" | **Volume Híbrido** | `/modelos/glamour-midnight/assets/img/volume-hibrido.png` |
| "Russo", "Volume Russo", "Fans" | **Volume Russo** | `/modelos/glamour-midnight/assets/img/volume-russo.png` |
| "Mega", "Mega Volume" | **Mega Volume** | `/modelos/glamour-midnight/assets/img/mega-volume.png` |
| "Fox", "Foxy", "Fox Eyes", "Efeito Raposa" | **Fox Eyes** | `/modelos/glamour-midnight/assets/img/fox-eyes.png` |
| "Lifting", "Lash Lift", "Curvatura" | **Lash Lifting** | `/modelos/glamour-midnight/assets/img/lash-lifting.png` |
| "Boneca", "Gatinho", "Mapping" | **Mapping Personalizado** | `/modelos/glamour-midnight/assets/img/mapping-boneca.png` |
| "Remoção", "Retirada" | **Remoção Segura** | `/modelos/glamour-midnight/assets/img/remocao.png` |

> [!IMPORTANT]
> **Serviço Novo / Desconhecido:**
> Se a cliente enviar um serviço que não existe na biblioteca padrão (ex: *"Hydra Gloss"*, *"Design com Henna"*, *"Spa Labial"*), mantenha o nome exato enviado por ela e aplique a imagem placeholder amigável `/modelos/glamour-midnight/assets/img/volume-brasileiro.png`, marcando `is_custom_photo: true`.

---

### 3. Montagem do Payload JSON

Monte o arquivo temporário ou payload JSON com a seguinte estrutura:

```json
{
  "client_name": "Nome da Cliente",
  "whatsapp": "11987654321",
  "instagram": "studiomariana",
  "location": "São Paulo - SP",
  "slug": "mariana-lashes",
  "model_id": "harmonia",
  "color_id": "rose",
  "hero_phrase": "Frase de impacto ou slogan personalizado",
  "cover_image_path": "caminho/para/imagem/local/capa.jpg",
  "services": [
    {
      "name": "Volume Brasileiro",
      "price": "140,00",
      "duration": "1h30",
      "maintenance": "90,00 (até 20 dias)"
    }
  ]
}
```

---

### 4. Execução do Motor de Criação

Execute o script Python nativo via `run_command`:

```powershell
python scripts/criar_catalogo.py "caminho_ou_json_payload"
```

O script cuidará de:
1. Fazer upload da foto de capa no Supabase Storage (`catalog-assets/covers/`).
2. Validar e reservar o slug único.
3. Inserir em `orders` com status `pendente_revisao`.
4. Inserir em `order_services` todos os procedimentos.

---

### 5. Apresentação do Resultado ao Usuário

Ao concluir, informe ao usuário de maneira concisa e elegante:
- **Status da Criação:** Confirmar sucesso no banco de dados.
- **Link de Pré-visualização:** Link direto (`/catalogo/?slug=...`) para ver o catálogo funcionando.
- **Link do Painel Admin:** Link direto para o editor (`/admin/editor.html?id=...`).
- **Mensagem VIP de Entrega:** Texto formatado para ele apenas copiar e disparar no WhatsApp da cliente.
