import os
import json
import ssl
import subprocess
import urllib.request
import urllib.parse

ACCESS_TOKEN = "EAAWMnrVYZAnsBSQhUa1umm9dSMxnUDgHrd9D2BJVKst0UIPoBLeN9lZAZBhKD5EKOXMoCLBI4dWlLEmhpA1Pn9HnovGlCl5fjvzgNl9TDUP8mE3tckRL9aGZCQgBNEZAj4IZC303CEhOAyH53nMMyyZBNadg5tHwNDJUphU7OZAtJi37uRsXdLhS2GtXDZA8pFTBDwFFEYVt2qbbRCN71Eq0yZBoBWqo3sIfkVdRY5dJmssSg6A2zFnr0yV9ITLF37Fs6R9uRCVZCkgcIuUTTTtuJbsLZACgQpFXvcLZAKCEXpwZDZD"
ACCOUNT_ID = "act_1626088674941828"
PAGE_ID = "1184875188046307" # Página oficial Vida de Lash Designer!
VIDEO_ID = "2606392629826012" # ID do Vídeo Uploaded com sucesso no Meta Ads

LANDING_PAGE_URL = "https://lashmenu.com/vendas/lpb/"

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

print("=== 1. UPLOAD DA MINIATURA THUMBNAIL DO VÍDEO ===")
thumb_path = "criativos/Videos/thumbnail.png"
img_hash = upload_image_via_curl(thumb_path)
print(f"✅ Hash da Miniatura Gerado: {img_hash}")

print("\n=== 2. CRIANDO O AD CREATIVE DO VÍDEO ===")
creative_payload = {
    "name": "Criativo - Vídeo 01 (Demonstração LashMenu)",
    "object_story_spec": json.dumps({
        "page_id": PAGE_ID, # Página Vida de Lash Designer
        "video_data": {
            "video_id": VIDEO_ID,
            "image_hash": img_hash,
            "title": "Veja como o LashMenu funciona na prática! ✨📱",
            "message": "Cansada de perder horas no Canva tentando criar tabela de preços?\n\nO LashMenu entrega seu catálogo digital profissional pronto, com fotos ampliadas dos cílios, tempo de cabine e botão direto para agendamento no WhatsApp!\n\n❌ Sem mensalidades. Pagamento único.\n🔗 Clique em Saiba Mais e garanta seu link exclusivo!",
            "call_to_action": {
                "type": "LEARN_MORE",
                "value": {
                    "link": LANDING_PAGE_URL
                }
            }
        }
    })
}

res_creative = api_post(f"{ACCOUNT_ID}/adcreatives", creative_payload)
print("Resposta Creative:", res_creative)

if res_creative and "id" in res_creative:
    creative_id = res_creative["id"]
    print(f"✅ Criativo do Vídeo Gerado com Sucesso! ID: {creative_id}")
    
    print("\n=== 3. VINCULANDO O ANÚNCIO DE VÍDEO NOS 3 CONJUNTOS DA CAMPANHA ===")
    total_created = 0
    for adset in ADSETS:
        ad_title = f"Ad Vídeo 01 - Demonstração Reels"
        ad_payload = {
            "name": ad_title,
            "adset_id": adset["id"],
            "creative": json.dumps({"creative_id": creative_id}),
            "status": "PAUSED" # Rascunho Seguro
        }
        res_ad = api_post(f"{ACCOUNT_ID}/ads", ad_payload)
        if res_ad and "id" in res_ad:
            total_created += 1
            print(f"  🎯 Anúncio de Vídeo publicado no {adset['name']}! (ID: {res_ad['id']})")
        else:
            print(f"  ⚠️ Erro ao criar anúncio de vídeo no {adset['name']}")

    print(f"\n🎉 DEPLOY DO VÍDEO CONCLUÍDO COM SUCESSO!")
    print(f"📊 Total de Anúncios de Vídeo Criados: {total_created} (Todos Pausados em Rascunho Seguro).")
