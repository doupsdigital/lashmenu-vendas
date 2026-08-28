import os
import json
import re
from dotenv import load_dotenv
from apify_client import ApifyClient
import pandas as pd
from apify_service import get_apify_client

load_dotenv()

# Mapeamento 100% verificado e humano para os leads de Goiânia
EXACT_NAME_MAP = {
    1: "Edivania",
    2: "Layfer",
    3: "Larissa",
    4: "Leticia",
    5: "Poliana",
    6: "Tanielly",
    7: "Serena",
    8: "Cinthya",
    9: "Milenne",
    10: "Brunna",
    11: "Bella",
    12: "Maria Eugênia",
    13: "Mariane",
    14: "Isabela",
    15: "Déborah",
    16: "Yara",
    17: "Kathellem",
    18: "Lollys",
    19: "Ariana",
    20: "", # Sobrancelhas Design -> Oii, tudo bem?
    21: "Elaíne",
    22: "Nayara",
    23: "Joana",
    24: "", # Cílios Showroom -> Oii, tudo bem?
    25: "Katyane",
    26: "Priscila",
    27: "Crys",
    28: "Aliany",
    29: "D'Isanto",
    30: "Ynnaá",
    31: "Tiffany",
    32: "Luana",
    33: "Maiza",
    34: "Kássia",
    35: "Jéssica",
    36: "Carvalho",
    37: "Lanna",
    38: "Faby",
    39: "Sara",
    40: "Ana Beatriz"
}

def clean_phone(phone_str):
    if not phone_str:
        return "", ""
    digits = re.sub(r'\D', '', str(phone_str))
    if not digits:
        return "", ""
    if digits.startswith("55"):
        wa_link = f"https://wa.me/{digits}"
    elif len(digits) in (10, 11):
        wa_link = f"https://wa.me/55{digits}"
    else:
        wa_link = f"https://wa.me/{digits}"
    return phone_str, wa_link

def extract_instagram(website_url):
    if not website_url:
        return ""
    if "instagram.com" in website_url.lower():
        match = re.search(r'instagram\.com/([^/?#]+)', website_url, re.IGNORECASE)
        if match:
            handle = match.group(1)
            if handle.lower() not in ('p', 'reel', 'stories', 'explore'):
                return f"@{handle}"
    return ""

def get_name_only(title, rank=None):
    """
    Retorna o nome exato refinado.
    """
    if rank and rank in EXACT_NAME_MAP:
        return EXACT_NAME_MAP[rank]
    
    clean = re.sub(r'(?i)(extensão de cílios|estética|sobrancelhas|curso|goiania|goiânia|lash design|lashes|studio|st\.|setor|by|-|,|\.|designer|design|cílios|cilios)', ' ', title)
    clean = ' '.join(clean.split())
    
    ignore_words = {'curso', 'especializado', 'em', 'da', 'de', 'do', 'e', 'showroom', 'beauty', 'espaço', 'espaco', 'centro', 'design', 'designer'}
    words = [w for w in clean.split() if w.lower() not in ignore_words and len(w) > 2]
    
    if words:
        return words[0].capitalize()
    return ""

def calculate_score(item):
    """
    Calcula pontuação de potencial de fechamento do LashMenu (0 a 100).
    """
    score = 0
    
    neighborhood = str(item.get("neighborhood") or "").strip().lower()
    premium_neighborhoods = ["marista", "bueno", "jardim goiás", "jardim goias", "oeste", "central", "leste vila nova", "alphaville", "alto da glória"]
    if any(b in neighborhood for b in premium_neighborhoods):
        score += 25
    elif neighborhood:
        score += 15

    reviews = item.get("reviewsCount") or 0
    if reviews >= 100:
        score += 30
    elif reviews >= 50:
        score += 25
    elif reviews >= 20:
        score += 20
    elif reviews >= 5:
        score += 10

    total_score = item.get("totalScore") or 0
    if total_score >= 4.9:
        score += 15
    elif total_score >= 4.5:
        score += 10

    phone = item.get("phone")
    if phone:
        score += 15

    website = item.get("website")
    if website:
        score += 15

    return score

def generate_pitch_1(title, rank=None):
    """
    1ª Mensagem: Abordagem fria persuasiva com emojis e nome 100% correto.
    """
    name = get_name_only(title, rank)
    greeting = f"Oii {name}" if name else "Oii, tudo bem?"
    
    pitch = (
        f"{greeting}, tudo bem? 💕 Vi o seu perfil no Google e achei os seus trabalhos de cílios simplesmente perfeitos! 😍✨\n\n"
        f"Sei como é corrido o dia a dia e quanto tempo a gente perde no WhatsApp explicando técnicas (Fio a Fio, Volume Russo, Brasileiro) e enviando tabelas soltas... 📝📲\n\n"
        f"Criamos o *LashMenu*, um catálogo digital interativo e super elegante para você colocar no link da bio do Instagram e mandar nas conversas, deixando seu atendimento muito mais profissional e acelerando os seus agendamentos! 💖🌸\n\n"
        f"Posso te mandar um modelo de demonstração para você ver como fica lindo na prática? 👁️✨"
    )
    return pitch

def generate_pitch_2(title, rank=None):
    """
    2ª Mensagem: Envio do modelo Harmonia Rose e pedido da tabela de preços.
    """
    name = get_name_only(title, rank)
    salutation = f" {name}" if name else ""
    
    script = (
        f"Que ótimo{salutation}! 😍💖 Segue o link de um modelo pronto para você testar a experiência como se fosse sua cliente:\n"
        f"👉 https://lashmenu.com/c/harmonia-rose ✨\n\n"
        f"Se você gostar da estrutura, me envia aqui uma foto ou lista dos seus procedimentos com os preços atuais que eu já monto a versão exclusiva do seu estúdio para você ver na prática! 🌸📲"
    )
    return script

def generate_pitch_3(title, rank=None):
    """
    3ª Mensagem: Envio do catálogo pronto + Apresentação da Oferta & Desconto Pix (R$ 167).
    """
    name = get_name_only(title, rank)
    salutation = f" {name}" if name else ""
    
    script = (
        f"Prontinho{salutation}! 🌸✨ Montei o catálogo exclusivo do seu estúdio para você dar uma olhada:\n"
        f"👉 [LINK_DO_CATALOGO_PERSONALIZADO_DELA] 😍💖\n\n"
        f"A assinatura da plataforma com suporte completo e hospedagem fica por R$ 197 no site oficial (https://lashmenu.com).\n\n"
        f"Mas como estamos conversando diretamente por aqui no WhatsApp, conseguimos uma condição super especial de 15% de desconto via Pix: fica por apenas *R$ 167 (pagamento único sem mensalidades)*! 🎉💎\n\n"
        f"Quer que eu já te envie a chave Pix para liberarmos o seu link definitivo hoje mesmo? 🚀💕"
    )
    return script

def process():
    dataset_id = "mFQN8LEZBwAalybcv"
    client = get_apify_client()
    items = client.dataset(dataset_id).list_items().items
    
    records = []
    for item in items:
        title = item.get("title") or "Estúdio Lash"
        phone_orig, wa_link = clean_phone(item.get("phone"))
        website = item.get("website") or ""
        instagram = extract_instagram(website)
        neighborhood = item.get("neighborhood") or item.get("city") or "Goiânia"
        rating = item.get("totalScore") or 0.0
        reviews = item.get("reviewsCount") or 0
        address = item.get("address") or ""
        google_maps_url = item.get("url") or ""
        category = item.get("categoryName") or "Lash Designer"
        
        potential_score = calculate_score(item)
        
        records.append({
            "Score_Potencial": potential_score,
            "Nome_Estudio": title,
            "Bairro": neighborhood,
            "Avaliação_Google": rating,
            "Total_Avaliações": reviews,
            "Telefone": phone_orig,
            "Link_WhatsApp": wa_link,
            "Instagram": instagram,
            "Website": website,
            "Endereço": address,
            "Link_GoogleMaps": google_maps_url,
            "Categoria": category
        })
    
    # Ordena pelo Score de Potencial (do maior para o menor)
    df = pd.DataFrame(records)
    df = df.sort_values(by=["Score_Potencial", "Total_Avaliações", "Avaliação_Google"], ascending=[False, False, False])
    df.reset_index(drop=True, inplace=True)
    df["Rank"] = df.index + 1

    # Adiciona as abordagens agora que já temos o Rank correto
    p1_list, p2_list, p3_list = [], [], []
    for idx, row in df.iterrows():
        rank = row['Rank']
        title = row['Nome_Estudio']
        p1_list.append(generate_pitch_1(title, rank))
        p2_list.append(generate_pitch_2(title, rank))
        p3_list.append(generate_pitch_3(title, rank))

    df['Abordagem_1_Inicial'] = p1_list
    df['Resposta_2_Demonstracao_SIM'] = p2_list
    df['Fechamento_3_Oferta_Preco_Pix'] = p3_list
    
    cols = [
        "Rank", "Score_Potencial", "Nome_Estudio", "Bairro", "Avaliação_Google", 
        "Total_Avaliações", "Telefone", "Link_WhatsApp", "Instagram", "Website", 
        "Abordagem_1_Inicial", "Resposta_2_Demonstracao_SIM", "Fechamento_3_Oferta_Preco_Pix", 
        "Endereço", "Link_GoogleMaps"
    ]
    df = df[cols]
    
    # Exporta para Excel (.xlsx)
    xlsx_path = "Prospecção/Leads_LashDesigner_Goiania.xlsx"
    with pd.ExcelWriter(xlsx_path, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="Leads Goiânia")
    print(f" Planilha Excel salva em: {xlsx_path}")
    
    # Exporta para CSV
    csv_path = "Prospecção/Leads_LashDesigner_Goiania.csv"
    df.to_csv(csv_path, index=False, encoding="utf-8-sig")
    print(f" CSV salvo em: {csv_path}")

    # Exporta para JSON no app de prospecção
    os.makedirs('prospeccao', exist_ok=True)
    df.to_json('prospeccao/leads.json', orient='records', force_ascii=False, indent=2)
    print(f" JSON gerado para CRM em: prospeccao/leads.json")
    
    # Exporta para Markdown (.md)
    md_path = "Prospecção/Leads_LashDesigner_Goiania.md"
    md_content = f"# 🎯 Leads Qualificados - Lash Designers Goiânia ({len(df)} Leads)\n\n"
    md_content += f"> **Classificação de Potencial para Venda do LashMenu** (Ordenado do maior potencial ao menor).\n\n"
    
    md_content += "## 📐 Metodologia e Critérios da Pontuação de Potencial (0 a 100 pontos)\n\n"
    md_content += "A pontuação de cada lead foi calculada com base na probabilidade de conversão para a venda do **LashMenu**:\n\n"
    md_content += "| Categoria | Critério | Pontuação | Justificativa de Vendas |\n"
    md_content += "| :--- | :--- | :---: | :--- |\n"
    md_content += "| **Localização Premium** | Bairros nobres (Setor Bueno, Marista, Jardim Goiás, Alto da Glória, Central, Oeste, Leste Vila Nova, Alphaville) | **+25 pts** | Estúdios com maior ticket médio e alta disposição a investir em imagem e tecnologia. |\n"
    md_content += "| **Outros Bairros Mapeados** | Demais bairros com localização física identificada | **+15 pts** | Estabelecimento físico com estrutura para atendimento de clientes. |\n"
    md_content += "| **Volume de Avaliações** | ≥ 100 avaliações no Google | **+30 pts** | Altíssimo fluxo diário de mensagens no WhatsApp perguntando valores e procedimentos. |\n"
    md_content += "| | 50 a 99 avaliações | **+25 pts** | Alto fluxo de clientes e necessidade de automatizar/profissionalizar o cardápio. |\n"
    md_content += "| | 20 a 49 avaliações | **+20 pts** | Estúdio em expansão constante. |\n"
    md_content += "| | 5 a 19 avaliações | **+10 pts** | Estúdio ativo com clientes validados. |\n"
    md_content += "| **Reputação / Nota** | Nota 4.9 a 5.0 estrelas | **+15 pts** | Serviço de excelência técnica (clientes muito satisfeitos). |\n"
    md_content += "| | Nota 4.5 a 4.8 estrelas | **+10 pts** | Ótima aceitação no mercado local. |\n"
    md_content += "| **Canal Direto** | Telefone / WhatsApp direto cadastrado | **+15 pts** | Permite prospecção e abordagem imediata via WhatsApp. |\n"
    md_content += "| **Presença Digital** | Website ou Instagram ativo | **+15 pts** | Negócio no digital que precisa de um link profissional de catálogo (LashMenu) na Bio. |\n\n"
    md_content += "---\n\n"
    md_content += "## 📋 Funil de 3 Passos de Abordagem\n\n"
    md_content += "1. **1ª Mensagem**: Abordagem fria rápida em 3 parágrafos.\n"
    md_content += "2. **2ª Mensagem**: Envio do link oficial do modelo Harmonia Rosé e pedido dos preços dela.\n"
    md_content += "3. **3ª Mensagem**: Envio do catálogo pronto + Oferta do site (R$ 197) vs Desconto Pix (R$ 167).\n\n"
    md_content += "---\n\n"
    md_content += "## 📋 Lista de Leads Ordenados por Potencial\n\n"
    
    for idx, row in df.iterrows():
        md_content += f"### #{row['Rank']} - {row['Nome_Estudio']}\n"
        md_content += f"- **Potencial LashMenu:** ⭐ `{row['Score_Potencial']} pts`\n"
        md_content += f"- **Bairro:** {row['Bairro']}\n"
        md_content += f"- **Avaliação:** {row['Avaliação_Google']} ⭐ ({row['Total_Avaliações']} avaliações)\n"
        md_content += f"- **Telefone:** {row['Telefone']} | [Abrir no WhatsApp]({row['Link_WhatsApp']})\n"
        if row['Instagram']:
            md_content += f"- **Instagram:** {row['Instagram']}\n"
        if row['Website']:
            md_content += f"- **Website:** {row['Website']}\n"
        md_content += f"- **Endereço:** {row['Endereço']}\n"
        md_content += f"- **Link no Google Maps:** [Ver no Maps]({row['Link_GoogleMaps']})\n\n"
        
        md_content += f"```text\n💬 1. ABORDAGEM INICIAL (WHATSAPP):\n\n{row['Abordagem_1_Inicial']}\n```\n\n"
        md_content += f"```text\n✅ 2. RESPOSTA COM LINK DEMO HARMONIA ROSÉ (SE ELA DISSER 'SIM'):\n\n{row['Resposta_2_Demonstracao_SIM']}\n```\n\n"
        md_content += f"```text\n💰 3. FECHAMENTO & OFERTA PIX (APÓS MONTAR O CATÁLOGO DELA):\n\n{row['Fechamento_3_Oferta_Preco_Pix']}\n```\n\n"
        md_content += "---\n\n"
        
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f" Arquivo Markdown salvo em: {md_path}")

if __name__ == "__main__":
    process()
