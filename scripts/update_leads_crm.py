import json
import csv
import os
import re

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

def get_name_only(title, rank=None):
    if rank and rank in EXACT_NAME_MAP:
        return EXACT_NAME_MAP[rank]
    clean = re.sub(r'(?i)(extensão de cílios|estética|sobrancelhas|curso|goiania|goiânia|lash design|lashes|studio|st\.|setor|by|-|,|\.|designer|design|cílios|cilios)', ' ', str(title or ''))
    clean = ' '.join(clean.split())
    ignore_words = {'curso', 'especializado', 'em', 'da', 'de', 'do', 'e', 'showroom', 'beauty', 'espaço', 'espaco', 'centro', 'design', 'designer'}
    words = [w for w in clean.split() if w.lower() not in ignore_words and len(w) > 2]
    if words:
        return words[0].capitalize()
    return ""

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

def gen_step1_v1(title, rank=None):
    name, g1, g2, salutation, name_or_estudio = get_lead_greetings(title, rank)
    return f"{g1}, tudo bem? 💕 Vi o seu perfil e achei os seus trabalhos de cílios simplesmente perfeitos! 😍✨ Você mesma quem cuida do agendamento por aqui?"

def gen_step1_v2(title, rank=None):
    name, g1, g2, salutation, name_or_estudio = get_lead_greetings(title, rank)
    return f"{g2}, como você está? 🌸 Tive uma dúvida rápida olhando o seu perfil e resolvi te mandar mensagem por aqui. Você é a própria {name_or_estudio} que atende no estúdio? 👁️"

def gen_step1_v3(title, rank=None):
    name, g1, g2, salutation, name_or_estudio = get_lead_greetings(title, rank)
    return f"{g1}, tudo joia? 💖 Estava olhando os seus atendimentos de cílios e fiquei encantada com a qualidade! Me tira uma dúvida rápida sobre o estúdio? ✨"

def gen_step2_v1(title, rank=None):
    name, g1, g2, salutation, name_or_estudio = get_lead_greetings(title, rank)
    return f"Que ótimo{salutation}! 😍 É que eu ajudo Lash Designers a valorizarem o trabalho e economizarem tempo no WhatsApp. Em vez de ficar mandando foto por foto de tabela solta ou explicando técnica por técnica, criamos o LashMenu: um catálogo digital interativo e lindo pro link do Insta e Whats! 🌸✨ Posso te mandar 15 segundinhos de um vídeo curto pra você ver como fica na prática? 💕"

def gen_step2_v2(title, rank=None):
    name, g1, g2, salutation, name_or_estudio = get_lead_greetings(title, rank)
    return f"Ah perfeita{salutation}! 🥰 É que a gente desenvolveu o LashMenu, que transforma aquela tabela de preços tradicional num catálogo digital super interativo e elegante para o seu estúdio. Fica incrível no link da bio e facilita muito o atendimento no Whats! 💎✨ Gravei uma demonstração rápida de 15s. Posso te mandar aqui pra você dar uma olhada? 👁️💖"

def gen_step2_v3(title, rank=None):
    name, g1, g2, salutation, name_or_estudio = get_lead_greetings(title, rank)
    return f"Maravilha{salutation}! 💕 Vários estúdios sofrem perdendo tempo no Whats passando valores e tirando dúvidas de procedimentos soltos. Com o LashMenu, o seu estúdio ganha um catálogo digital interativo de alto padrão que agiliza seus agendamentos! 🚀🌸 Posso te enviar uma demonstração super rápida pra você ver como funciona? ✨"

def gen_step3_v1(title, rank=None):
    name, g1, g2, salutation, name_or_estudio = get_lead_greetings(title, rank)
    return f"Prontinho{salutation}! 🌸✨ Montei o catálogo exclusivo do seu estúdio para você dar uma olhada:\n👉 [LINK_DO_CATALOGO_PERSONALIZADO_DELA] 😍💖\n\nO valor de criação completa do LashMenu é R$ 197 no cartão. Mas fechando hoje por aqui no Pix, temos a condição especial por apenas *R$ 167 à vista (pagamento único sem mensalidades!)*. 🚀💎\n\nQuer que eu já te envie a chave Pix para liberarmos o seu link definitivo hoje mesmo? 💕"

def gen_step3_v2(title, rank=None):
    name, g1, g2, salutation, name_or_estudio = get_lead_greetings(title, rank)
    return f"Prontinho{salutation}! 🥰 Olha como ficou elegante a apresentação dos seus procedimentos:\n👉 [LINK_DO_CATALOGO_PERSONALIZADO_DELA] ✨🌸\n\nMe conta o que achou! A taxa de configuração completa com suporte e hospedagem é R$ 197. Mas fechando via Pix hoje, liberamos por *R$ 167 à vista* (sem mensalidade nenhuma). 👑💎\n\nPosso gerar a chave Pix para ativar o seu catálogo oficial agora? 🚀"

def gen_step3_v3(title, rank=None):
    name, g1, g2, salutation, name_or_estudio = get_lead_greetings(title, rank)
    return f"Ficou pronto{salutation}! 💖 Dá uma olhadinha em como o seu estúdio vai se destacar com o LashMenu:\n👉 [LINK_DO_CATALOGO_PERSONALIZADO_DELA] 👁️✨\n\nConsigo te garantir a condição exclusiva por Pix: de R$ 197 por apenas *R$ 167 à vista* (taxa única, seu catálogo fica ativo sem cobranças mensais!). 🎉🌸\n\nQuer que eu te passe a chave Pix para finalizarmos? 💕"

def main():
    json_path = "prospeccao/leads.json"
    if not os.path.exists(json_path):
        print("Erro: prospeccao/leads.json nao encontrado.")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        leads = json.load(f)

    for lead in leads:
        rank = lead.get("Rank")
        title = lead.get("Nome_Estudio", "")

        lead["Abordagem_1_Inicial"] = gen_step1_v1(title, rank)
        lead["Abordagem_1_Variação_1"] = gen_step1_v1(title, rank)
        lead["Abordagem_1_Variação_2"] = gen_step1_v2(title, rank)
        lead["Abordagem_1_Variação_3"] = gen_step1_v3(title, rank)

        lead["Resposta_2_Demonstracao_SIM"] = gen_step2_v1(title, rank)
        lead["Resposta_2_Variação_1"] = gen_step2_v1(title, rank)
        lead["Resposta_2_Variação_2"] = gen_step2_v2(title, rank)
        lead["Resposta_2_Variação_3"] = gen_step2_v3(title, rank)

        lead["Fechamento_3_Oferta_Preco_Pix"] = gen_step3_v1(title, rank)
        lead["Fechamento_3_Variação_1"] = gen_step3_v1(title, rank)
        lead["Fechamento_3_Variação_2"] = gen_step3_v2(title, rank)
        lead["Fechamento_3_Variação_3"] = gen_step3_v3(title, rank)

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(leads, f, ensure_ascii=False, indent=2)
    print(f"Atualizado {json_path} com sucesso.")

    # Atualiza CSV
    csv_path = "Prospecção/Leads_LashDesigner_Goiania.csv"
    if leads:
        headers = list(leads[0].keys())
        with open(csv_path, "w", encoding="utf-8-sig", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            writer.writerows(leads)
        print(f"Atualizado {csv_path} com sucesso.")

    # Atualiza Markdown
    md_path = "Prospecção/Leads_LashDesigner_Goiania.md"
    md_content = f"# 🎯 Leads Qualificados - Lash Designers Goiânia ({len(leads)} Leads)\n\n"
    md_content += f"> **Classificação de Potencial para Venda do LashMenu** (Ordenado do maior potencial ao menor).\n\n"
    md_content += "## 📋 Funil Anti-Ban de 3 Passos de Abordagem com 3 Variações\n\n"
    md_content += "1. **1ª Mensagem (Gancho Curto Anti-Ban)**: 1 a 2 linhas curtas, sem links, focada em gerar curiosidade e resposta.\n"
    md_content += "2. **2ª Mensagem (Qualificação / Oferta de Vídeo 15s)**: Apresentação leve + pedido para enviar vídeo curto do LashMenu.\n"
    md_content += "3. **3ª Mensagem (Fechamento / Desconto Pix R$ 167)**: Link do catálogo personalizado dela + Oferta Pix R$ 167.\n\n"
    md_content += "---\n\n"

    for lead in leads:
        md_content += f"### #{lead['Rank']} - {lead['Nome_Estudio']}\n"
        md_content += f"- **Potencial LashMenu:** ⭐ `{lead.get('Score_Potencial', 0)} pts`\n"
        md_content += f"- **Bairro:** {lead.get('Bairro', '')}\n"
        md_content += f"- **Avaliação:** {lead.get('Avaliação_Google', 0)} ⭐ ({lead.get('Total_Avaliações', 0)} avaliações)\n"
        md_content += f"- **Telefone:** {lead.get('Telefone', '')} | [Abrir no WhatsApp]({lead.get('Link_WhatsApp', '')})\n"
        if lead.get('Instagram'):
            md_content += f"- **Instagram:** {lead['Instagram']}\n"
        md_content += f"- **Endereço:** {lead.get('Endereço', '')}\n\n"

        md_content += f"```text\n💬 1. ABORDAGEM INICIAL (GANCHO ANTI-BAN - VAR 01):\n{lead['Abordagem_1_Variação_1']}\n```\n\n"
        md_content += f"```text\n💬 1. ABORDAGEM INICIAL (VAR 02):\n{lead['Abordagem_1_Variação_2']}\n```\n\n"
        md_content += f"```text\n💬 1. ABORDAGEM INICIAL (VAR 03):\n{lead['Abordagem_1_Variação_3']}\n```\n\n"

        md_content += f"```text\n✅ 2. QUALIFICAÇÃO / OFERTA VÍDEO DEMO (VAR 01):\n{lead['Resposta_2_Variação_1']}\n```\n\n"
        md_content += f"```text\n💰 3. FECHAMENTO & OFERTA PIX (VAR 01):\n{lead['Fechamento_3_Variação_1']}\n```\n\n"
        md_content += "---\n\n"

    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f"Atualizado {md_path} com sucesso.")

if __name__ == "__main__":
    main()
