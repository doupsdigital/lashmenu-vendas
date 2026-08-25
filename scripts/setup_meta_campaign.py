import os
import json
import ssl
import urllib.request
import urllib.parse

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

ACCESS_TOKEN = "EAAWMnrVYZAnsBSWnn2z1DDZAumGqQUWgKf230ivUQZBQ7ZC7yLRJuQWFaUF4EoULFZBCcMcZB2mYbMgOf1XPufsIevyoa5QcCCLe8LAbjhaXsDafudn2AVCyHTHpRfa1g4DVOhJt23nZB0ReXKUVyZA1C2jLsUmhGlTmRoSYaTZCiZC0ar5653o3Po9ZAMk5XuThFWYN5dukApEUvCYTZBZBOZAKGObSdcQkltABkRV5994XOQ0jN2FkmZB95uQVoIrEOR4fOYfNYYZC6LECPANDPyHKcIH5JboD6UUa1gByZBKWzBgZDZD"
ACCOUNT_ID = "act_1626088674941828"
PIXEL_ID = "1042165951490026"
CAMPAIGN_ID = "120247805395900218" # Campanha criada com sucesso!

def api_post(endpoint, data):
    url = f"https://graph.facebook.com/v20.0/{endpoint}"
    data["access_token"] = ACCESS_TOKEN
    encoded_data = urllib.parse.urlencode(data).encode("utf-8")
    req = urllib.request.Request(url, data=encoded_data)
    try:
        with urllib.request.urlopen(req, context=ssl_context) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"HTTP Error {e.code} on {endpoint}: {err_body}")
        return None

print(f"=== USANDO CAMPANHA EXISTENTE ID: {CAMPAIGN_ID} ===")

adsets_config = [
    {
        "name": "AdSet 01 — Aberto Feminino BR (20-42 anos)",
        "daily_budget": "2000", # R$ 20,00
        "targeting": {
            "geo_locations": {"countries": ["BR"]},
            "age_min": 20,
            "age_max": 42,
            "genders": [2]
        }
    },
    {
        "name": "AdSet 02 — Interesses em Estética & Beleza",
        "daily_budget": "2000", # R$ 20,00
        "targeting": {
            "geo_locations": {"countries": ["BR"]},
            "age_min": 20,
            "age_max": 42,
            "genders": [2]
        }
    },
    {
        "name": "AdSet 03 — Empreendedoras & Profissionais de Estética",
        "daily_budget": "2000", # R$ 20,00
        "targeting": {
            "geo_locations": {"countries": ["BR"]},
            "age_min": 20,
            "age_max": 42,
            "genders": [2]
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
        "promoted_object": json.dumps({
            "pixel_id": PIXEL_ID,
            "custom_event_type": "PURCHASE"
        }),
        "status": "PAUSED",
        "targeting": json.dumps(adset_info["targeting"])
    }
    
    res_adset = api_post(f"{ACCOUNT_ID}/adsets", adset_payload)
    print(f"Criando AdSet '{adset_info['name']}':", res_adset)
    if res_adset and "id" in res_adset:
        created_adsets.append({"id": res_adset["id"], "name": adset_info["name"]})

print(f"\n🎉 SUCESSO! {len(created_adsets)} CONJUNTOS DE ANÚNCIOS CRIADOS COM SUCESSO!")
for a in created_adsets:
    print(f" -> {a['name']} | ID: {a['id']}")
