import json
import ssl
import urllib.request
import urllib.parse

ACCESS_TOKEN = "EAAWMnrVYZAnsBSbeLrkbIac1LhKkKdYtQ7CY810ZAXhoWYQJDqlYZB97Bh6VZAUvZA1dHAt0FQkc7YhkYjDPKKJodZAvTkZAbluarxBt0uwDBZBrqRYbcaEu0zJFUbyGVBZCsMOH0IuFe78zZCHobaZCibSB7pZBnRbesQOh0kKIej6mWYYgeioZBZCib95AqHhPweRn9jsiQ19a4HTxhfVtm0yo2dJXKWZBYxY7NxfGW2zSRoAuFNOimH4HlZB8rzygKVHZB7y9umsTwlDU5ZA3v6tZAu43MQyzdVYuitAMWnB2h9d5AZDZD"
ACCOUNT_ID = "act_1626088674941828"
CAMPAIGN_ID = "120247805503880218"
PAGE_ID = "1184875188046307"

OLD_WA_ADSET_ID = "120247895283210218"

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

print("=== 1. PAUSANDO ADSET ANTIGO DO WHATSAPP ===")
api_post(OLD_WA_ADSET_ID, {"status": "PAUSED"})
print(f"🔴 AdSet {OLD_WA_ADSET_ID} desativado!")

print("\n=== 2. CRIANDO NOVO ADSET WHATSAPP PONTE (DESTINATION: WEBSITE -> LASHMENU.COM/VENDAS/WA/) ===")

adset_wa_bridge = {
    "name": "[LASHMENU] AdSet 05 — WhatsApp Direto X1 (Aberto Feminino 20-42 anos)",
    "campaign_id": CAMPAIGN_ID,
    "daily_budget": 800, # R$ 8,00 / dia
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

res_adset = api_post(f"{ACCOUNT_ID}/adsets", adset_wa_bridge)
print("Resposta AdSet WA Bridge:", res_adset)

if res_adset and "id" in res_adset:
    new_adset_id = res_adset["id"]
    print(f"\n✅ Novo AdSet WhatsApp Direto Criado com Sucesso! ID: {new_adset_id}")
    
    # Criar o Creative com WhatsApp oficial
    wa_creative_payload = {
        "name": "Criativo - WhatsApp Direto X1 (08-GPT)",
        "object_story_spec": json.dumps({
            "page_id": PAGE_ID,
            "link_data": {
                "image_hash": "159228bc0522fd0300dd4d3cc5769a8d",
                "link": "https://lashmenu.com/vendas/wa/", # Link ponte oficial com auto-redirect imediato pro WhatsApp
                "message": "Quer ver como o LashMenu fica com as fotos e tabela de preços do seu estúdio?\n\n💬 Clique no botão Saiba Mais para me chamar direto no WhatsApp! Te envio um exemplo ao vivo agora.",
                "name": "Falar no WhatsApp • Atendimento Rápido",
                "description": "Exemplo ao vivo no WhatsApp • LashMenu",
                "call_to_action": {
                    "type": "LEARN_MORE",
                    "value": {
                        "link": "https://lashmenu.com/vendas/wa/"
                    }
                }
            }
        })
    }
    
    res_cr = api_post(f"{ACCOUNT_ID}/adcreatives", wa_creative_payload)
    print("Resposta Creative:", res_cr)
    
    creative_id = res_cr.get("id") if res_cr else None
    
    if creative_id:
        ad_payload = {
            "name": "Ad 01 - Mensagem Direta WhatsApp X1",
            "adset_id": new_adset_id,
            "creative": json.dumps({"creative_id": creative_id}),
            "status": "ACTIVE"
        }
        res_ad = api_post(f"{ACCOUNT_ID}/ads", ad_payload)
        print(f"🎯 Anúncio Publicado com Sucesso! ID: {res_ad.get('id') if res_ad else 'Erro'}")
