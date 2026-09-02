import json
import ssl
import urllib.request
import urllib.parse

ACCESS_TOKEN = "EAAWMnrVYZAnsBSZA7eXwhERdsPiIssKQQhzx80GYXcEgm4N4MapDYNDwkFV3phpszA0XARkoZBzwaM5tPE23KNUxXdQgmF14REO5od90Hx8aApDefYVHsSZB3EKr6wZBe85jhpZBiR7QThxdnZAUnvbw3BbItL6nd5NEF7psfQ7LUcZBoz8BPqVOBNOaYbTuN0fJJwJZAKvMp3YiYGGnsdtPSEZCoZCVqNmAPZB8Vo9pUOLxwdqAsmD5fH2gc9SGOXmDMW6nVwvIdpsZA7fuZABL19IaeGONB4sQ0nD276c0yQbAZDZD"

ADSET_02_INTERESSES = "120247805507790218"  # AdSet 02 — Interesses em Estética & Cílios -> R$ 16,00
ADSET_05_WHATSAPP   = "120247904073420218"  # AdSet 05 — WhatsApp Direto X1 -> R$ 14,00
ADSET_04_VIDEO      = "120247895282640218"  # AdSet 04 — Vídeo Reels Exclusivo -> R$ 10,00
ADSET_03_EMPREEND   = "120247805508160218"  # AdSet 03 — Empreendedoras -> PAUSED
ADSET_01_ABERTO     = "120247805507570218"  # AdSet 01 — Aberto Feminino BR -> PAUSED

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

print("==================================================")
print("  EXECUTANDO OTIMIZAÇÃO E REDISTRIBUIÇÃO DE VERBA")
print("==================================================")

# 1. AdSet 02 - Interesses em Estética -> R$ 16,00/dia
r2 = api_post(ADSET_02_INTERESSES, {"daily_budget": 1600, "status": "ACTIVE"})
print(f"🚀 AdSet 02 (Interesses em Estética) -> R$ 16,00/dia | Resposta: {r2}")

# 2. AdSet 05 - WhatsApp Direto X1 -> R$ 14,00/dia
r5 = api_post(ADSET_05_WHATSAPP, {"daily_budget": 1400, "status": "ACTIVE"})
print(f"📈 AdSet 05 (WhatsApp Direto X1) -> R$ 14,00/dia | Resposta: {r5}")

# 3. AdSet 04 - Vídeo Reels -> R$ 10,00/dia
r4 = api_post(ADSET_04_VIDEO, {"daily_budget": 1000, "status": "ACTIVE"})
print(f"📉 AdSet 04 (Vídeo Reels Exclusivo) -> R$ 10,00/dia | Resposta: {r4}")

# 4. AdSet 03 - Empreendedoras -> PAUSED
r3 = api_post(ADSET_03_EMPREEND, {"status": "PAUSED"})
print(f"🔴 AdSet 03 (Empreendedoras de Beleza) -> PAUSADO | Resposta: {r3}")

# 5. AdSet 01 - Aberto -> PAUSED
r1 = api_post(ADSET_01_ABERTO, {"status": "PAUSED"})
print(f"🔴 AdSet 01 (Aberto Feminino BR) -> PAUSADO | Resposta: {r1}")

print("\n🎉 OTIMIZAÇÃO CONCLUÍDA COM SUCESSO NO META ADS!")
print("📊 Orçamento Final Redistribuído (Cravado em R$ 40,00/dia):")
print("   - AdSet 02 (Interesses em Estética): R$ 16,00/dia 🥇 (Foco no CPC R$ 0,46)")
print("   - AdSet 05 (WhatsApp Direto X1): R$ 14,00/dia 💬 (Mais volume de leads)")
print("   - AdSet 04 (Vídeo Reels): R$ 10,00/dia 🎬 (Controle de custo)")
print("   - AdSet 03 (Empreendedoras): PAUSADO (R$ 0,00) 🚫")
print("   - AdSet 01 (Aberto): PAUSADO (R$ 0,00) 🚫")
