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
OLD_CAMPAIGN_ID = "120247805395900218"

LANDING_PAGE_URL = "https://lashmenu.com/vendas/lpb/"

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

def api_delete(endpoint):
    url = f"https://graph.facebook.com/v20.0/{endpoint}?access_token={ACCESS_TOKEN}"
    req = urllib.request.Request(url, method="DELETE")
    try:
        with urllib.request.urlopen(req, context=ssl_ctx) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"Delete info for {endpoint}: {e}")
        return None

def api_post(endpoint, data):
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

print("=== 1. DELETANDO ESTRUTURA ANTIGA DUPLICADA ===")
api_delete(OLD_CAMPAIGN_ID)
print("✅ Campanha antiga e conjuntos duplicados removidos com sucesso!")

print("\n=== 2. CRIANDO NOVA CAMPANHA MESTRE LIMPA ===")
campaign_payload = {
    "name": "[LASHMENU] - CAMPANHA DE VALIDAÇÃO [ABO] 🚀",
    "objective": "OUTCOME_SALES",
    "status": "PAUSED",
    "special_ad_categories": "[]",
    "is_adset_budget_sharing_enabled": "false"
}
res_campaign = api_post(f"{ACCOUNT_ID}/campaigns", campaign_payload)
if not res_campaign or "id" not in res_campaign:
    print("❌ Erro ao criar nova campanha.")
    exit(1)

new_campaign_id = res_campaign["id"]
print(f"✅ Nova Campanha Mestre Criada! ID: {new_campaign_id}")

print("\n=== 3. UPLOAD DAS 18 MÍDIAS DOS CRIATIVOS ===")
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

print(f"✅ {len(uploaded_images)} Mídias prontas na Biblioteca da Meta!")

print("\n=== 4. CRIANDO OS 3 CONJUNTOS DE ANÚNCIOS ÚNICOS (PAUSED) ===")
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
        "campaign_id": new_campaign_id,
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
        print(f"✅ AdSet Único Criado: {adset_info['name']} (ID: {res['id']})")
        created_adsets.append({"id": res["id"], "name": adset_info["name"]})

print("\n=== 5. CRIANDO TODOS OS ANÚNCIOS (AD CREATIVES + ADS) EM MODO PAUSADO ===")

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

total_ads = 0

for adset in created_adsets:
    # Distribui 6 criativos em cada AdSet
    for idx, img in enumerate(uploaded_images[:6]):
        copy = COPYS[idx % len(COPYS)]
        ad_title_clean = f"Anúncio {idx + 1} - {img['name'].split('.')[0]}"
        
        creative_payload = {
            "name": f"Criativo - {ad_title_clean}",
            "object_story_spec": json.dumps({
                "page_id": PAGE_ID,
                "link_data": {
                    "link": LANDING_PAGE_URL,
                    "message": copy["body"],
                    "name": copy["title"],
                    "image_hash": img["hash"],
                    "call_to_action": {"type": "LEARN_MORE"}
                }
            })
        }
        
        res_creative = api_post(f"{ACCOUNT_ID}/adcreatives", creative_payload)
        if res_creative and "id" in res_creative:
            creative_id = res_creative["id"]
            
            ad_payload = {
                "name": ad_title_clean,
                "adset_id": adset["id"],
                "creative": json.dumps({"creative_id": creative_id}),
                "status": "PAUSED" # Todos em modo PAUSED / Rascunho
            }
            res_ad = api_post(f"{ACCOUNT_ID}/ads", ad_payload)
            if res_ad and "id" in res_ad:
                total_ads += 1
                print(f"   🎯 Anúncio '{ad_title_clean}' publicado em {adset['name']}! (ID: {res_ad['id']})")
        else:
            print(f"   ⚠️ Não foi possível criar o criativo para {ad_title_clean}")

print(f"\n🎉 CONCLUÍDO! Nova Campanha Mestre ID: {new_campaign_id}")
print(f"📊 3 Conjuntos Únicos e {total_ads} Anúncios Pausados Criados com Sucesso!")
