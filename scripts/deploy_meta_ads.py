import os
import json
import ssl
import subprocess
import urllib.request
import urllib.parse

ACCESS_TOKEN = "EAAWMnrVYZAnsBSWnn2z1DDZAumGqQUWgKf230ivUQZBQ7ZC7yLRJuQWFaUF4EoULFZBCcMcZB2mYbMgOf1XPufsIevyoa5QcCCLe8LAbjhaXsDafudn2AVCyHTHpRfa1g4DVOhJt23nZB0ReXKUVyZA1C2jLsUmhGlTmRoSYaTZCiZC0ar5653o3Po9ZAMk5XuThFWYN5dukApEUvCYTZBZBOZAKGObSdcQkltABkRV5994XOQ0jN2FkmZB95uQVoIrEOR4fOYfNYYZC6LECPANDPyHKcIH5JboD6UUa1gByZBKWzBgZDZD"
ACCOUNT_ID = "act_1626088674941828"
PIXEL_ID = "1042165951490026"
PAGE_ID = "575735048958585"
CAMPAIGN_ID = "120247805395900218"

LANDING_PAGE_URL = "https://lashmenu.com/vendas/lpb/"

COPYS = [
    {
        "title": "Cansada de perder horas no Canva? 🥱✨",
        "body": "Você atende o dia todo, chega cansada e ainda tem que tentar mexer no Canva pra criar uma tabela de preços que nunca fica do jeito profissional que seu trabalho merece?\n\nO LashMenu resolve isso para você. Nós entregamos seu catálogo digital profissional pronto, com fotos ampliadas dos cílios, tempo de cabine, valores e botão direto para agendamento no WhatsApp.\n\n❌ Sem mensalidades. Pagamento único.\n🔗 Clique em Saiba Mais e garanta seu link exclusivo!"
    },
    {
        "title": "Faça suas clientes pagarem o valor justo pelos seus cílios! 💎",
        "body": "Quando uma cliente pergunta seus preços no WhatsApp, você ainda envia aquela mensagem de texto solta?\n\nApresentação é tudo! Uma vitrine digital impecável transmite autoridade imediata, elimina pedidos de desconto e faz a cliente entender o valor da sua técnica (Volume Brasileiro, Foxy, Lifting).\n\n🔗 Clique em Garantir Meu LashMenu e transforme a imagem do seu estúdio!"
    },
    {
        "title": "Seu estúdio merece um link impecável na Bio do Instagram! 📱✨",
        "body": "Chega de responder as mesmas dúvidas no WhatsApp todos os dias.\n\nCom o LashMenu, sua cliente clica no link da bio, vê os resultados reais, lê as orientações e já clica no botão pronta para agendar o horário dela.\n\n⚡ Entregamos tudo pronto para você em até 24h!\n🔗 Clique em Saiba Mais e garanta o seu!"
    }
]

def upload_image_via_curl(image_path):
    cmd = [
        "curl", "-s", "-F", f"filename=@{image_path}",
        f"https://graph.facebook.com/v20.0/{ACCOUNT_ID}/adimages?access_token={ACCESS_TOKEN}"
    ]
    try:
        res = subprocess.check_output(cmd).decode("utf-8")
        data = json.loads(res)
        if "images" in data:
            for k, v in data["images"].items():
                return v.get("hash")
    except Exception as e:
        print(f"Erro ao subir imagem {image_path}: {e}")
    return None

def api_post(endpoint, data):
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE
    
    url = f"https://graph.facebook.com/v20.0/{endpoint}"
    data["access_token"] = ACCESS_TOKEN
    encoded_data = urllib.parse.urlencode(data).encode("utf-8")
    req = urllib.request.Request(url, data=encoded_data)
    try:
        with urllib.request.urlopen(req, context=ssl_ctx) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"HTTP Error {e.code} on {endpoint}: {err_body}")
        return None

print("=== CRIANDO ADSETS EM MODO PAUSED (RASCUNHO SEGURO) ===")

claude_dir = "./criativos/Claude"
chatgpt_dir = "./criativos/ChatGPT"

uploaded_images = []

for folder, prefix in [(claude_dir, "Claude"), (chatgpt_dir, "ChatGPT")]:
    if os.path.exists(folder):
        files = sorted([f for f in os.listdir(folder) if f.endswith(".png")])
        for fname in files:
            fpath = os.path.join(folder, fname)
            img_hash = upload_image_via_curl(fpath)
            if img_hash:
                uploaded_images.append({"name": f"{prefix} - {fname}", "hash": img_hash})

print(f"✅ {len(uploaded_images)} MÍDIAS NA BIBLIOTECA DA META.")

adsets_config = [
    {
        "name": "AdSet 01 — Aberto Feminino BR (20-42 anos)",
        "daily_budget": "2000",
        "targeting": {
            "geo_locations": {"countries": ["BR"]},
            "age_min": 20,
            "age_max": 42,
            "genders": [2],
            "targeting_automation": {"advantage_audience": 0}
        }
    },
    {
        "name": "AdSet 02 — Interesses em Estética & Cílios",
        "daily_budget": "2000",
        "targeting": {
            "geo_locations": {"countries": ["BR"]},
            "age_min": 20,
            "age_max": 42,
            "genders": [2],
            "targeting_automation": {"advantage_audience": 0}
        }
    },
    {
        "name": "AdSet 03 — Empreendedoras de Beleza",
        "daily_budget": "2000",
        "targeting": {
            "geo_locations": {"countries": ["BR"]},
            "age_min": 20,
            "age_max": 42,
            "genders": [2],
            "targeting_automation": {"advantage_audience": 0}
        }
    }
]

created_adsets = []
for adset_info in adsets_config:
    adset_payload = {
        "name": adset_info["name"],
        "campaign_id": CAMPAIGN_ID,
        "daily_budget": adset_info["daily_budget"],
        "billing_event": "IMPRESSIONS",
        "optimization_goal": "OFFSITE_CONVERSIONS",
        "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
        "destination_type": "WEBSITE",
        "promoted_object": json.dumps({"pixel_id": PIXEL_ID, "custom_event_type": "PURCHASE"}),
        "status": "PAUSED",
        "targeting": json.dumps(adset_info["targeting"])
    }
    res = api_post(f"{ACCOUNT_ID}/adsets", adset_payload)
    if res and "id" in res:
        print(f"✅ AdSet Criado (PAUSED): {adset_info['name']} (ID: {res['id']})")
        created_adsets.append({"id": res["id"], "name": adset_info["name"]})

print(f"\n🎉 CRIAÇÃO CONCLUÍDA COM SUCESSO!")
print(f"📊 AdSets Criados: {len(created_adsets)} de 3")
for a in created_adsets:
    print(f" -> {a['name']} | ID: {a['id']}")
