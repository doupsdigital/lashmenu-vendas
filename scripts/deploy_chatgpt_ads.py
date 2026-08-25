import os
import json
import ssl
import subprocess
import urllib.request
import urllib.parse

ACCESS_TOKEN = "EAAWMnrVYZAnsBST3OvASwfooyQeaZCbcXK4Ue0QHRvFjq63ecxSNKI5Rdo4WJMtr2C5Lc89lE729mPAY6mFIZBgxYTZBXwYMFXW5K7e67xAOkcJeuPIjYq68VInmQCiZAT5ZB1ngDBJpJfZAF2SbNvannd1pGSJAmPXXZC6WGv9fZCIoFEj8gmDUz4zoHOUTO0pZBZClV9B7bANJwuwErr6ryUZCETYUwVUOZCYa3sUEcdGTjuBXwq4Ji7erRmr4JqjSpeQDciXyZAUg3QEe83340VvtrgpU5DNiaDw75xslXAwwZDZD"
ACCOUNT_ID = "act_1626088674941828"
PAGE_ID = "1184875188046307" # Página oficial Vida de Lash Designer!

LANDING_PAGE_URL = "https://lashmenu.com/vendas/lpb/"

# IDs dos 3 Conjuntos de Anúncios ativos na conta da Meta
ADSETS = [
    {"id": "120247805507570218", "name": "AdSet 01 — Aberto Feminino BR (20-42 anos)"},
    {"id": "120247805507790218", "name": "AdSet 02 — Interesses em Estética & Cílios"},
    {"id": "120247805508160218", "name": "AdSet 03 — Empreendedoras de Beleza"}
]

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

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

print("=== 1. UPLOAD DOS 10 CRIATIVOS DO CHATGPT ===")
chatgpt_dir = "./criativos/ChatGPT"
gpt_images = []

if os.path.exists(chatgpt_dir):
    files = sorted([f for f in os.listdir(chatgpt_dir) if f.endswith(".png")])
    for fname in files:
        fpath = os.path.join(chatgpt_dir, fname)
        img_hash = upload_image_via_curl(fpath)
        if img_hash:
            gpt_images.append({"name": fname, "hash": img_hash})

print(f"✅ {len(gpt_images)} MÍDIAS DO CHATGPT NA BIBLIOTECA DA META!")

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

print("\n=== 2. CRIANDO OS ANÚNCIOS CHATGPT COM A PÁGINA 'VIDA DE LASH DESIGNER' (PAUSED) ===")
for adset in ADSETS:
    for idx, img in enumerate(gpt_images):
        copy = COPYS[idx % len(COPYS)]
        clean_name = img['name'].replace('.png', '')
        ad_title = f"Ad {idx + 1} - GPT ({clean_name})"
        
        creative_payload = {
            "name": f"Criativo - {ad_title}",
            "object_story_spec": json.dumps({
                "page_id": PAGE_ID, # Página Vida de Lash Designer!
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
                total_ads += 1
                print(f"  🎯 Anúncio criado: '{ad_title}' no {adset['name']} (ID: {res_ad['id']})")
        else:
            print(f"  ⚠️ Aviso ao criar criativo para {ad_title}")

print(f"\n🎉 SUBSTITUIÇÃO COMPLETA PARA CHATGPT E PÁGINA 'VIDA DE LASH DESIGNER' CONCLUÍDA!")
print(f"📊 Total de Anúncios Criados: {total_ads} (Todos Pausados em Rascunho Seguro).")
