import json
import ssl
import urllib.request

ACCESS_TOKEN = "EAAWMnrVYZAnsBSeumvX1TDm62FAjE4MlJoXYwOJZAxQ5AuTlu6lJcVeZBOD5EEUWSalWjvPxwfm1m3lgoh9nP1uwhhliHpIiXcl7ZAvUqHEzVZBYa3HfRIMtn0OiGCyihob0nyIAkoEwZA8gHzu0AiKj4smOVr7Y3IMYaqXCMTC2KGUmvZCZAZBw4MiqRFDnwlsvOPZA4RPOn9aA0ppCs8UJFU4nZBZACCwPLDQc2NGDjiw1piNv8IBrfr7nNnnQrJtKk1BVdfohvYWnaD1fe306RswC2kH7yhX36JZBg1bgshgZDZD"
CAMPAIGN_ID = "120247805503880218"

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

def fetch(url):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, context=ssl_ctx) as resp:
        return json.loads(resp.read().decode("utf-8"))

print("=== INSIGHTS DA CAMPANHA ATIVA [LASHMENU] ===")
url_camp = f"https://graph.facebook.com/v20.0/{CAMPAIGN_ID}/insights?date_preset=maximum&fields=spend,impressions,reach,clicks,cpc,cpm,ctr,inline_link_clicks,cost_per_inline_link_click,actions&access_token={ACCESS_TOKEN}"
res_camp = fetch(url_camp)
print("Resumo Campanha Ativa:", json.dumps(res_camp, indent=2))

print("\n=== INSIGHTS DOS ANÚNCIOS DA CAMPANHA ATIVA ===")
url_ads = f"https://graph.facebook.com/v20.0/{CAMPAIGN_ID}/insights?level=ad&date_preset=maximum&limit=100&fields=ad_id,ad_name,adset_id,adset_name,spend,impressions,clicks,cpc,cpm,ctr,inline_link_clicks,cost_per_inline_link_click,actions&access_token={ACCESS_TOKEN}"
res_ads = fetch(url_ads)
ads_list = res_ads.get("data", [])

print(f"Total de Anúncios com Dados: {len(ads_list)}")
print(f"{'Nome do Anúncio':<35} | {'Gasto':<8} | {'Impr':<6} | {'Link':<5} | {'CTR':<6} | {'CPC':<6} | {'Checkouts'}")
print("-" * 90)

parsed_ads = []
for ad in ads_list:
    spend = float(ad.get("spend", 0))
    impressions = int(ad.get("impressions", 0))
    clicks = int(ad.get("clicks", 0))
    link_clicks = int(ad.get("inline_link_clicks", 0))
    cpc = float(ad.get("cpc", 0)) if clicks > 0 else 0
    ctr = float(ad.get("ctr", 0))
    
    actions = ad.get("actions", [])
    initiate_checkout = 0
    purchases = 0
    for a in actions:
        if a["action_type"] == "initiate_checkout":
            initiate_checkout = int(a["value"])
        elif a["action_type"] == "purchase":
            purchases = int(a["value"])

    parsed_ads.append({
        "name": ad.get("ad_name"),
        "adset": ad.get("adset_name"),
        "spend": spend,
        "impressions": impressions,
        "clicks": clicks,
        "link_clicks": link_clicks,
        "cpc": cpc,
        "ctr": ctr,
        "checkouts": initiate_checkout,
        "purchases": purchases
    })

parsed_ads.sort(key=lambda x: x["spend"], reverse=True)

for a in parsed_ads:
    print(f"{a['name'][:34]:<35} | R${a['spend']:>6.2f} | {a['impressions']:>6} | {a['link_clicks']:>5} | {a['ctr']:>5.2f}% | R${a['cpc']:>4.2f} | {a['checkouts']:>9}")
