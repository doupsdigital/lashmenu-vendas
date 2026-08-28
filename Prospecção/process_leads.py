import os
import json
import re
from dotenv import load_dotenv
from apify_client import ApifyClient
import pandas as pd
from apify_service import get_apify_client

load_dotenv()

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

def get_name_only(title):
    """
    Extrai o primeiro nome limpo ou o nome do estúdio de forma natural.
    """
    clean = re.sub(r'(?i)(extensão de cílios|estética|sobrancelhas|curso|goiania|goiânia|lash design|lashes|studio|st\.|setor|by|-|,|\.)', ' ', title)
    clean = ' '.join(clean.split())
    
    ignore_words = {'curso', 'especializado', 'em', 'da', 'de', 'do', 'e', 'showroom', 'beauty', 'espaço', 'espaco', 'centro'}
    words = [w for w in clean.split() if w.lower() not in ignore_words and len(w) > 2]
    
    if words:
        return words[0].capitalize()
    return ""

def calculate_score(item):
    """
    Calcula a pontuação de potencial de fechamento do LashMenu (0 a 100).
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

def generate_pitch(title):
    """
    Gera abordagem fria objetiva em 3 parágrafos curtos e altamente persuasivos.
    """
    name = get_name_only(title)
    greeting = f"Oii {name}" if name else "Oii, tudo bem?"
    
    pitch = (
        f"{greeting}, tudo bem? 👋 Vi o seu perfil no Google e achei os seus trabalhos de cílios incríveis!\n\n"
        f"Sei como é corrido o dia a dia e quanto tempo a gente perde no WhatsApp explicando técnicas (Fio a Fio, Volume Russo, Brasileiro) e enviando tabelas soltas... "
        f"Criamos o *LashMenu*, um catálogo digital interativo e super elegante para você colocar no link da bio do Instagram e mandar nas conversas, deixando seu atendimento muito mais profissional e acelerando os agendamentos.\n\n"
        f"Posso te mandar um modelo de demonstração para você ver como fica na prática?"
    )
    return pitch

def generate_followup_yes(title):
    """
    Roteiro para quando o lead responde SIM / demonstra interesse.
    """
    name = get_name_only(title)
    salutation = f" {name}" if name else ""
    
    script = (
        f"Que ótimo{salutation}! 💖 Segue o link de um modelo pronto para você testar a experiência como se fosse sua cliente:\n"
        f"👉 [INSERIR LINK DO DEMO AQUI - Ex: modelo Harmonia Rose]\n\n"
        f"Se você gostar da estrutura, me envia aqui uma foto ou lista dos seus procedimentos com os preços atuais que eu já monto a versão exclusiva do seu estúdio para você ver na prática!"
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
        pitch = generate_pitch(title)
        followup_yes = generate_followup_yes(title)
        
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
            "Abordagem_Inicial_WhatsApp": pitch,
            "Resposta_Se_Responder_SIM": followup_yes,
            "Endereço": address,
            "Link_GoogleMaps": google_maps_url,
            "Categoria": category
        })
    
    # Ordena pelo Score de Potencial (do maior para o menor)
    df = pd.DataFrame(records)
    df = df.sort_values(by=["Score_Potencial", "Total_Avaliações", "Avaliação_Google"], ascending=[False, False, False])
    df.reset_index(drop=True, inplace=True)
    df["Rank"] = df.index + 1
    
    cols = [
        "Rank", "Score_Potencial", "Nome_Estudio", "Bairro", "Avaliação_Google", 
        "Total_Avaliações", "Telefone", "Link_WhatsApp", "Instagram", "Website", 
        "Abordagem_Inicial_WhatsApp", "Resposta_Se_Responder_SIM", "Endereço", "Link_GoogleMaps"
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
        
        md_content += f"```text\n💬 1. ABORDAGEM INICIAL (WHATSAPP):\n\n{row['Abordagem_Inicial_WhatsApp']}\n```\n\n"
        md_content += f"```text\n✅ 2. RESPOSTA SE ELA DISSER 'SIM' / DEMONSTRAR INTERESSE:\n\n{row['Resposta_Se_Responder_SIM']}\n```\n\n"
        md_content += "---\n\n"
        
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f" Arquivo Markdown salvo em: {md_path}")

if __name__ == "__main__":
    process()
