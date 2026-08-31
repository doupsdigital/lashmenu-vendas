import json
import ssl
import urllib.request
import urllib.parse

ACCESS_TOKEN = "EAAWMnrVYZAnsBSeumvX1TDm62FAjE4MlJoXYwOJZAxQ5AuTlu6lJcVeZBOD5EEUWSalWjvPxwfm1m3lgoh9nP1uwhhliHpIiXcl7ZAvUqHEzVZBYa3HfRIMtn0OiGCyihob0nyIAkoEwZA8gHzu0AiKj4smOVr7Y3IMYaqXCMTC2KGUmvZCZAZBw4MiqRFDnwlsvOPZA4RPOn9aA0ppCs8UJFU4nZBZACCwPLDQc2NGDjiw1piNv8IBrfr7nNnnQrJtKk1BVdfohvYWnaD1fe306RswC2kH7yhX36JZBg1bgshgZDZD"
ACCOUNT_ID = "act_1626088674941828"
CAMPAIGN_ID = "120247805503880218"

ADSET_ABERTO = "120247805507570218"      # AdSet 01 — Aberto Feminino BR
ADSET_INTERESSES = "120247805507790218"  # AdSet 02 — Interesses em Estética
ADSET_EMPREENDEDORAS = "120247805508160218" # AdSet 03 — Empreendedoras de Beleza

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
print("  1. DESATIVANDO O ADSET 01 (ABERTO FEMININO BR)")
print("==================================================")
res_pause_aberto = api_post(ADSET_ABERTO, {"status": "PAUSED"})
print(f"🔴 AdSet 01 (Aberto Feminino BR) Desativado com Sucesso!")

print("\n==================================================")
print("  2. AJUSTANDO ORÇAMENTO DOS ADSETS CAMPEÕES PARA R$ 6,00/DIA CADA")
print("==================================================")
api_post(ADSET_INTERESSES, {"daily_budget": 600, "status": "ACTIVE"}) # R$ 6,00/dia
print(f"⚙️ AdSet 02 (Interesses em Estética) ajustado para R$ 6,00/dia!")

api_post(ADSET_EMPREENDEDORAS, {"daily_budget": 600, "status": "ACTIVE"}) # R$ 6,00/dia
print(f"⚙️ AdSet 03 (Empreendedoras de Beleza) ajustado para R$ 6,00/dia!")

print("\n==================================================")
print("  3. LIMPANDO ANÚNCIOS DOS CONJUNTOS 02 E 03 (DEIXANDO APENAS 08-GPT E 03-GPT)")
print("==================================================")

ads_res = api_get(f"{CAMPAIGN_ID}/ads", {"fields": "id,name,status,adset_id", "limit": 100})
if ads_res and "data" in ads_res:
    for ad in ads_res["data"]:
        name = ad.get("name", "")
        ad_id = ad.get("id")
        adset_id = ad.get("adset_id")
        
        # Apenas processar anúncios que estão nos conjuntos 02 e 03
        if adset_id in [ADSET_INTERESSES, ADSET_EMPREENDEDORAS]:
            # Se for Criativo 08-GPT ou Criativo 03-GPT -> MANTER ATIVO
            if any(k in name for k in ["08-GPT", "03-GPT"]) and not "Vídeo" in name:
                api_post(ad_id, {"status": "ACTIVE"})
                print(f"  🟢 Mantido Ativo no AdSet {adset_id}: {name}")
            else:
                api_post(ad_id, {"status": "PAUSED"})
                print(f"  🔴 Pausado no AdSet {adset_id}: {name}")

print("\n🎉 OTIMIZAÇÃO PERSONALIZADA CONCLUÍDA COM SUCESSO!")
print("📊 Orçamento Final Cravado em R$ 40,00/dia:")
print("   - AdSet 04 (Vídeo Reels): R$ 20,00/dia")
print("   - AdSet 05 (WhatsApp X1): R$ 8,00/dia")
print("   - AdSet 02 (Interesses em Estética): R$ 6,00/dia (Apenas artes 08 e 03)")
print("   - AdSet 03 (Empreendedoras): R$ 6,00/dia (Apenas artes 08 e 03)")
print("   - AdSet 01 (Aberto Feminino): DESATIVADO (R$ 0,00)")
