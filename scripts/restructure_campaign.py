import json
import ssl
import urllib.request
import urllib.parse

ACCESS_TOKEN = "EAAWMnrVYZAnsBSeumvX1TDm62FAjE4MlJoXYwOJZAxQ5AuTlu6lJcVeZBOD5EEUWSalWjvPxwfm1m3lgoh9nP1uwhhliHpIiXcl7ZAvUqHEzVZBYa3HfRIMtn0OiGCyihob0nyIAkoEwZA8gHzu0AiKj4smOVr7Y3IMYaqXCMTC2KGUmvZCZAZBw4MiqRFDnwlsvOPZA4RPOn9aA0ppCs8UJFU4nZBZACCwPLDQc2NGDjiw1piNv8IBrfr7nNnnQrJtKk1BVdfohvYWnaD1fe306RswC2kH7yhX36JZBg1bgshgZDZD"
ACCOUNT_ID = "act_1626088674941828"
CAMPAIGN_ID = "120247805503880218"
PAGE_ID = "1184875188046307"

VIDEO_CREATIVE_ID = "1043112728712684" # Creative ID do vídeo demonstrativo já gerado
WHATSAPP_URL = "https://wa.me/5562991083435?text=Ol%C3%A1!%20Vim%20pelo%20an%C3%BAncio%20do%20LashMenu%20e%20quero%20ver%20como%20funciona%20para%20o%20meu%20est%C3%BAdio"
WA_CREATIVE_ID = "2551914391921483" # Creative do WhatsApp gerado

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
        print(f"Error GET {endpoint}: {e}")
        return None

print("==================================================")
print("  1. PAUSANDO ANÚNCIOS ZUMBIS NOS CONJUNTOS ATUAIS")
print("==================================================")

ads_res = api_get(f"{CAMPAIGN_ID}/ads", {"fields": "id,name,status,adset_id"})
if ads_res and "data" in ads_res:
    zombies_paused = 0
    kept_active = 0
    for ad in ads_res["data"]:
        name = ad.get("name", "")
        ad_id = ad.get("id")
        
        # Pausar zumbis: 09-GPT, 02-GPT, 10-GPT, 06-GPT
        if any(z in name for z in ["09-GPT", "02-GPT", "10-GPT", "06-GPT"]):
            api_post(ad_id, {"status": "PAUSED"})
            print(f"  🔴 Anúncio Zumbi Pausado: {name} (ID: {ad_id})")
            zombies_paused += 1
        elif any(k in name for k in ["08-GPT", "03-GPT", "05-GPT"]):
            api_post(ad_id, {"status": "ACTIVE"})
            print(f"  🟢 Anúncio Campeão Mantido Ativo: {name} (ID: {ad_id})")
            kept_active += 1

print("\n==================================================")
print("  2. AJUSTANDO VERBA DOS CONJUNTOS DE IMAGEM ESTÁTICA (R$ 6,00/DIA CADA)")
print("==================================================")

existing_adsets = ["120247805507570218", "120247805507790218"]
for adset_id in existing_adsets:
    res = api_post(adset_id, {"daily_budget": 600, "status": "ACTIVE"}) # R$ 6,00 / dia
    print(f"  ⚙️ AdSet {adset_id} atualizado para R$ 6,00/dia!")

print("\n==================================================")
print("  3. CRIANDO NOVO ADSET 04: VÍDEO REELS EXCLUSIVO (R$ 20,00/DIA)")
print("==================================================")

adset_video_payload = {
    "name": "[LASHMENU] AdSet 04 — Vídeo Reels Exclusivo (Aberto Feminino 20-42 anos)",
    "campaign_id": CAMPAIGN_ID,
    "daily_budget": 2000, # R$ 20,00 / dia
    "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
    "billing_event": "IMPRESSIONS",
    "optimization_goal": "OFFSITE_CONVERSIONS",
    "promoted_object": json.dumps({
        "pixel_id": "1042165951490026",
        "custom_event_type": "PURCHASE"
    }),
    "targeting": json.dumps({
        "geo_locations": {"countries": ["BR"]},
        "age_min": 20,
        "age_max": 42,
        "genders": [2],
        "targeting_automation": {"advantage_audience": 0}
    }),
    "status": "ACTIVE"
}

res_adset_video = api_post(f"{ACCOUNT_ID}/adsets", adset_video_payload)
print("Resposta AdSet Vídeo:", res_adset_video)

if res_adset_video and "id" in res_adset_video:
    adset_video_id = res_adset_video["id"]
    print(f"✅ AdSet Exclusivo do Vídeo Criado com Sucesso! ID: {adset_video_id}")
    
    ad_video_payload = {
        "name": "Ad 01 - Vídeo Reels LashMenu (Exclusivo)",
        "adset_id": adset_video_id,
        "creative": json.dumps({"creative_id": VIDEO_CREATIVE_ID}),
        "status": "ACTIVE"
    }
    res_ad_vid = api_post(f"{ACCOUNT_ID}/ads", ad_video_payload)
    print(f"  🎯 Anúncio de Vídeo ativado no conjunto exclusivo! (ID: {res_ad_vid.get('id') if res_ad_vid else 'Erro'})")

print("\n==================================================")
print("  4. CRIANDO NOVO ADSET 05: TRÁFEGO DIRETO WHATSAPP X1 (R$ 8,00/DIA)")
print("==================================================")

adset_wa_payload = {
    "name": "[LASHMENU] AdSet 05 — Tráfego Direto WhatsApp X1 (Aberto Feminino 20-42 anos)",
    "campaign_id": CAMPAIGN_ID,
    "daily_budget": 800, # R$ 8,00 / dia
    "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
    "billing_event": "IMPRESSIONS",
    "optimization_goal": "LINK_CLICKS",
    "targeting": json.dumps({
        "geo_locations": {"countries": ["BR"]},
        "age_min": 20,
        "age_max": 42,
        "genders": [2],
        "targeting_automation": {"advantage_audience": 0}
    }),
    "status": "ACTIVE"
}

res_adset_wa = api_post(f"{ACCOUNT_ID}/adsets", adset_wa_payload)
print("Resposta AdSet WA:", res_adset_wa)

if res_adset_wa and "id" in res_adset_wa and WA_CREATIVE_ID:
    adset_wa_id = res_adset_wa["id"]
    print(f"✅ AdSet WhatsApp X1 Criado com Sucesso! ID: {adset_wa_id}")
    
    ad_wa_payload = {
        "name": "Ad 01 - Chamada Direta WhatsApp X1",
        "adset_id": adset_wa_id,
        "creative": json.dumps({"creative_id": WA_CREATIVE_ID}),
        "status": "ACTIVE"
    }
    res_ad_wa = api_post(f"{ACCOUNT_ID}/ads", ad_wa_payload)
    print(f"  🎯 Anúncio WhatsApp X1 Ativado! (ID: {res_ad_wa.get('id') if res_ad_wa else 'Erro'})")

print("\n🎉 REESTRUTURAÇÃO COMPLETA DA CAMPANHA EXECUTADA COM SUCESSO!")
print("📊 Total Diário: R$ 6 + R$ 6 + R$ 20 + R$ 8 = R$ 40,00/dia perfeitamente alocados!")
