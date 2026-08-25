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

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

def api_get(endpoint, params=None):
    if params is None:
        params = {}
    params["access_token"] = ACCESS_TOKEN
    query = urllib.parse.urlencode(params)
    url = f"https://graph.facebook.com/v20.0/{endpoint}?{query}"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, context=ssl_ctx) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"API Get error on {endpoint}: {e}")
        return None

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

print("=== 1. REMOVENDO ANÚNCIOS COM IMAGENS DO CLAUDE ===")
existing_ads = api_get(f"{ACCOUNT_ID}/ads", {"fields": "id,name"})
if existing_ads and "data" in existing_ads:
    for ad in existing_ads["data"]:
        if "Claude" in ad.get("name", ""):
            print(f"  Deletando anúncio Claude: {ad['name']} (ID: {ad['id']})")
            api_delete(ad["id"])

print("\n=== 2. CARREGANDO EXCLUSIVAMENTE OS 10 CRIATIVOS DO CHATGPT ===")
chatgpt_dir = "./criativos/ChatGPT"
gpt_images = []

if os.path.exists(chatgpt_dir):
    files = sorted([f for f in os.listdir(chatgpt_dir) if f.endswith(".png")])
    for fname in files:
        fpath = os.path.join(chatgpt_dir, fname)
        print(f"Subindo criativo ChatGPT: {fname}...")
        img_hash = upload_image_via_curl(fpath)
        if img_hash:
            print(f"  -> Hash: {img_hash}")
            gpt_images.append({"name": f"ChatGPT - {fname}", "hash": img_hash})

print(f"✅ {len(gpt_images)} IMAGENS DO CHATGPT PRONTAS NA META!")

# Obter AdSets existentes da campanha
adsets_res = api_get(f"{CAMPAIGN_ID}/adsets", {"fields": "id,name"})
adsets = adsets_res.get("data", []) if adsets_res else []
print(f"✅ Encontrados {len(adsets)} Conjuntos de Anúncios na campanha.")

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

total_new_ads = 0

print("\n=== 3. CRIANDO OS ANÚNCIOS EXCLUSIVOS DO CHATGPT EM MODO PAUSED ===")
for adset in adsets:
    for idx, img in enumerate(gpt_images):
        copy = COPYS[idx % len(COPYS)]
        ad_title = f"Ad {idx + 1} - {img['name'].replace('.png', '')}"
        
        creative_payload = {
            "name": f"Criativo - {ad_title}",
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
                "name": ad_title,
                "adset_id": adset["id"],
                "creative": json.dumps({"creative_id": creative_id}),
                "status": "PAUSED" # Rascunho Seguro
            }
            res_ad = api_post(f"{ACCOUNT_ID}/ads", ad_payload)
            if res_ad and "id" in res_ad:
                total_new_ads += 1
                print(f"  🎯 Anúncio ChatGPT criado: '{ad_title}' no {adset['name']} (ID: {res_ad['id']})")

print(f"\n🎉 SUBSTITUIÇÃO CONCLUÍDA COM SUCESSO!")
print(f"📊 Criativos do ChatGPT Vinculados: {total_new_ads} Anúncios Pausados Criados!")
