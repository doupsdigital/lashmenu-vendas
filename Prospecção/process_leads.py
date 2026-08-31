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

def get_lead_greetings(title, rank=None):
    name = get_name_only(title, rank)
    if name:
        g1 = f"Oii {name}"
        g2 = f"Olá {name}"
        salutation = f" {name}"
        name_or_estudio = name
    else:
        g1 = "Oii, tudo bem?"
        g2 = "Olá, tudo bem?"
        salutation = ""
        name_or_estudio = "você"
    return name, g1, g2, salutation, name_or_estudio

def generate_pitch_1_v1(title, rank=None):
    name, g1, g2, salutation, name_or_estudio = get_lead_greetings(title, rank)
    return f"{g1}, tudo bem? 💕 Vi o seu perfil e achei os seus trabalhos de cílios simplesmente perfeitos! 😍✨ Você mesma quem cuida do agendamento por aqui?"

def generate_pitch_1_v2(title, rank=None):
    name, g1, g2, salutation, name_or_estudio = get_lead_greetings(title, rank)
    return f"{g2}, como você está? 🌸 Tive uma dúvida rápida olhando o seu perfil e resolvi te mandar mensagem por aqui. Você é a própria {name_or_estudio} que atende no estúdio? 👁️"

def generate_pitch_1_v3(title, rank=None):
    name, g1, g2, salutation, name_or_estudio = get_lead_greetings(title, rank)
    return f"{g1}, tudo joia? 💖 Estava olhando os seus atendimentos de cílios e fiquei encantada com a qualidade! Me tira uma dúvida rápida sobre o estúdio? ✨"

def generate_pitch_1(title, rank=None):
    return generate_pitch_1_v1(title, rank)

def generate_pitch_2_v1(title, rank=None):
    name, g1, g2, salutation, name_or_estudio = get_lead_greetings(title, rank)
    return f"Que ótimo{salutation}! 😍 É que eu ajudo Lash Designers a valorizarem o trabalho e economizarem tempo no WhatsApp. Em vez de ficar mandando foto por foto de tabela solta ou explicando técnica por técnica, criamos o LashMenu: um catálogo digital interativo e lindo pro link do Insta e Whats! 🌸✨ Posso te mandar 15 segundinhos de um vídeo curto pra você ver como fica na prática? 💕"

def generate_pitch_2_v2(title, rank=None):
    name, g1, g2, salutation, name_or_estudio = get_lead_greetings(title, rank)
    return f"Ah perfeita{salutation}! 🥰 É que a gente desenvolveu o LashMenu, que transforma aquela tabela de preços tradicional num catálogo digital super interativo e elegante para o seu estúdio. Fica incrível no link da bio e facilita muito o atendimento no Whats! 💎✨ Gravei uma demonstração rápida de 15s. Posso te mandar aqui pra você dar uma olhada? 👁️💖"

def generate_pitch_2_v3(title, rank=None):
    name, g1, g2, salutation, name_or_estudio = get_lead_greetings(title, rank)
    return f"Maravilha{salutation}! 💕 Vários estúdios sofrem perdendo tempo no Whats passando valores e tirando dúvidas de procedimentos soltos. Com o LashMenu, o seu estúdio ganha um catálogo digital interativo de alto padrão que agiliza seus agendamentos! 🚀🌸 Posso te enviar uma demonstração super rápida pra você ver como funciona? ✨"

def generate_pitch_2(title, rank=None):
    return generate_pitch_2_v1(title, rank)

def generate_pitch_3_v1(title, rank=None):
    name, g1, g2, salutation, name_or_estudio = get_lead_greetings(title, rank)
    return f"Prontinho{salutation}! 🌸✨ Montei o catálogo exclusivo do seu estúdio para você dar uma olhada:\n👉 [LINK_DO_CATALOGO_PERSONALIZADO_DELA] 😍💖\n\nO valor de criação completa do LashMenu é R$ 197 no cartão. Mas fechando hoje por aqui no Pix, temos a condição especial por apenas *R$ 167 à vista (pagamento único sem mensalidades!)*. 🚀💎\n\nQuer que eu já te envie a chave Pix para liberarmos o seu link definitivo hoje mesmo? 💕"

def generate_pitch_3_v2(title, rank=None):
    name, g1, g2, salutation, name_or_estudio = get_lead_greetings(title, rank)
    return f"Prontinho{salutation}! 🥰 Olha como ficou elegante a apresentação dos seus procedimentos:\n👉 [LINK_DO_CATALOGO_PERSONALIZADO_DELA] ✨🌸\n\nMe conta o que achou! A taxa de configuração completa com suporte e hospedagem é R$ 197. Mas fechando via Pix hoje, liberamos por *R$ 167 à vista* (sem mensalidade nenhuma). 👑💎\n\nPosso gerar a chave Pix para ativar o seu catálogo oficial agora? 🚀"

def generate_pitch_3_v3(title, rank=None):
    name, g1, g2, salutation, name_or_estudio = get_lead_greetings(title, rank)
    return f"Ficou pronto{salutation}! 💖 Dá uma olhadinha em como o seu estúdio vai se destacar com o LashMenu:\n👉 [LINK_DO_CATALOGO_PERSONALIZADO_DELA] 👁️✨\n\nConsigo te garantir a condição exclusiva por Pix: de R$ 197 por apenas *R$ 167 à vista* (taxa única, seu catálogo fica ativo sem cobranças mensais!). 🎉🌸\n\nQuer que eu te passe a chave Pix para finalizarmos? 💕"

def generate_pitch_3(title, rank=None):
    return generate_pitch_3_v1(title, rank)

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

    # Adiciona as abordagens
    p1_v1_list, p1_v2_list, p1_v3_list = [], [], []
    p2_v1_list, p2_v2_list, p2_v3_list = [], [], []
    p3_v1_list, p3_v2_list, p3_v3_list = [], [], []

    for idx, row in df.iterrows():
        rank = row['Rank']
        title = row['Nome_Estudio']
        p1_v1_list.append(generate_pitch_1_v1(title, rank))
        p1_v2_list.append(generate_pitch_1_v2(title, rank))
        p1_v3_list.append(generate_pitch_1_v3(title, rank))
        
        p2_v1_list.append(generate_pitch_2_v1(title, rank))
        p2_v2_list.append(generate_pitch_2_v2(title, rank))
        p2_v3_list.append(generate_pitch_2_v3(title, rank))
        
        p3_v1_list.append(generate_pitch_3_v1(title, rank))
        p3_v2_list.append(generate_pitch_3_v2(title, rank))
        p3_v3_list.append(generate_pitch_3_v3(title, rank))

    df['Abordagem_1_Inicial'] = p1_v1_list
    df['Abordagem_1_Variação_1'] = p1_v1_list
    df['Abordagem_1_Variação_2'] = p1_v2_list
    df['Abordagem_1_Variação_3'] = p1_v3_list
    
    df['Resposta_2_Demonstracao_SIM'] = p2_v1_list
    df['Resposta_2_Variação_1'] = p2_v1_list
    df['Resposta_2_Variação_2'] = p2_v2_list
    df['Resposta_2_Variação_3'] = p2_v3_list

    df['Fechamento_3_Oferta_Preco_Pix'] = p3_v1_list
    df['Fechamento_3_Variação_1'] = p3_v1_list
    df['Fechamento_3_Variação_2'] = p3_v2_list
    df['Fechamento_3_Variação_3'] = p3_v3_list

    cols = [
        "Rank", "Score_Potencial", "Nome_Estudio", "Bairro", "Avaliação_Google", 
        "Total_Avaliações", "Telefone", "Link_WhatsApp", "Instagram", "Website", 
        "Abordagem_1_Inicial", "Abordagem_1_Variação_1", "Abordagem_1_Variação_2", "Abordagem_1_Variação_3",
        "Resposta_2_Demonstracao_SIM", "Resposta_2_Variação_1", "Resposta_2_Variação_2", "Resposta_2_Variação_3",
        "Fechamento_3_Oferta_Preco_Pix", "Fechamento_3_Variação_1", "Fechamento_3_Variação_2", "Fechamento_3_Variação_3",
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
    md_content += "2. **2ª Mensagem**: Opção de 3 Modelos de Demonstração (Harmonia Rosé em Destaque, Clássico Rosé e Glamour Midnight) + pedido dos preços dela.\n"
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
        md_content += f"```text\n✅ 2. RESPOSTA COM 3 MODELOS (SE ELA DISSER 'SIM'):\n\n{row['Resposta_2_Demonstracao_SIM']}\n```\n\n"
        md_content += f"```text\n💰 3. FECHAMENTO & OFERTA PIX (APÓS MONTAR O CATÁLOGO DELA):\n\n{row['Fechamento_3_Oferta_Preco_Pix']}\n```\n\n"
        md_content += "---\n\n"
        
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f" Arquivo Markdown salvo em: {md_path}")

if __name__ == "__main__":
    process()
