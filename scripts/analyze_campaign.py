import json
import ssl
import urllib.request
import urllib.parse

ACCESS_TOKEN = "EAAWMnrVYZAnsBSeumvX1TDm62FAjE4MlJoXYwOJZAxQ5AuTlu6lJcVeZBOD5EEUWSalWjvPxwfm1m3lgoh9nP1uwhhliHpIiXcl7ZAvUqHEzVZBYa3HfRIMtn0OiGCyihob0nyIAkoEwZA8gHzu0AiKj4smOVr7Y3IMYaqXCMTC2KGUmvZCZAZBw4MiqRFDnwlsvOPZA4RPOn9aA0ppCs8UJFU4nZBZACCwPLDQc2NGDjiw1piNv8IBrfr7nNnnQrJtKk1BVdfohvYWnaD1fe306RswC2kH7yhX36JZBg1bgshgZDZD"
ACCOUNT_ID = "act_1626088674941828"

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

def fetch_all(url):
    results = []
    while url:
        req = urllib.request.Request(url)
        try:
            with urllib.request.urlopen(req, context=ssl_ctx) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                results.extend(data.get("data", []))
                url = data.get("paging", {}).get("next")
        except Exception as e:
            print("Error fetching:", e)
            break
    return results

print("=== PUXANDO DADOS COMPLETOS DA CONTA DE ANÚNCIOS ===")
url_account = f"https://graph.facebook.com/v20.0/{ACCOUNT_ID}/insights?date_preset=maximum&fields=spend,impressions,reach,clicks,cpc,cpm,ctr,inline_link_clicks,cost_per_inline_link_click,actions,action_values&access_token={ACCESS_TOKEN}"
account_data = fetch_all(url_account)

print("\n--- VISÃO GERAL DA CONTA ---")
if account_data:
    tot = account_data[0]
    print(f"Gasto Total: R$ {float(tot.get('spend', 0)):.2f}")
    print(f"Impressões: {tot.get('impressions')}")
    print(f"Alcance: {tot.get('reach')}")
    print(f"Cliques Totais: {tot.get('clicks')}")
    print(f"Cliques no Link: {tot.get('inline_link_clicks')}")
    print(f"CPC Médio: R$ {float(tot.get('cpc', 0)):.2f}")
    print(f"CPM Médio: R$ {float(tot.get('cpm', 0)):.2f}")
    print(f"CTR Médio: {float(tot.get('ctr', 0)):.2f}%")
    actions = tot.get("actions", [])
    for a in actions:
        if a["action_type"] in ["initiate_checkout", "purchase", "landing_page_view", "link_click"]:
            print(f"Ação [{a['action_type']}]: {a['value']}")

url_ads = f"https://graph.facebook.com/v20.0/{ACCOUNT_ID}/insights?date_preset=maximum&level=ad&limit=100&fields=ad_id,ad_name,adset_id,adset_name,spend,impressions,clicks,cpc,cpm,ctr,inline_link_clicks,cost_per_inline_link_click,actions&access_token={ACCESS_TOKEN}"
ads_data = fetch_all(url_ads)

print(f"\n--- ANÁLISE DETALHADA POR ANÚNCIO (Total: {len(ads_data)} Anúncios com Dados) ---")
parsed_ads = []
for ad in ads_data:
    spend = float(ad.get("spend", 0))
    impressions = int(ad.get("impressions", 0))
    clicks = int(ad.get("clicks", 0))
    link_clicks = int(ad.get("inline_link_clicks", 0))
    cpc = float(ad.get("cpc", 0)) if clicks > 0 else 0
    cpm = float(ad.get("cpm", 0))
    ctr = float(ad.get("ctr", 0))
    
    actions = ad.get("actions", [])
    initiate_checkout = 0
    purchases = 0
    landing_page_views = 0
    for a in actions:
        if a["action_type"] == "initiate_checkout":
            initiate_checkout = int(a["value"])
        elif a["action_type"] == "purchase":
            purchases = int(a["value"])
        elif a["action_type"] == "landing_page_view":
            landing_page_views = int(a["value"])

    parsed_ads.append({
        "id": ad.get("ad_id"),
        "name": ad.get("ad_name"),
        "adset": ad.get("adset_name"),
        "spend": spend,
        "impressions": impressions,
        "clicks": clicks,
        "link_clicks": link_clicks,
        "cpc": cpc,
        "cpm": cpm,
        "ctr": ctr,
        "lp_views": landing_page_views,
        "checkouts": initiate_checkout,
        "purchases": purchases
    })

# Ordenar por gasto decrescente
parsed_ads.sort(key=lambda x: x["spend"], reverse=True)

print(f"{'Nome do Anúncio':<35} | {'Gasto':<8} | {'Impr':<6} | {'Cliques':<7} | {'Link':<5} | {'CTR':<6} | {'CPC':<6} | {'Checkouts'}")
print("-" * 95)
for a in parsed_ads:
    print(f"{a['name'][:34]:<35} | R${a['spend']:>6.2f} | {a['impressions']:>6} | {a['clicks']:>7} | {a['link_clicks']:>5} | {a['ctr']:>5.2f}% | R${a['cpc']:>4.2f} | {a['checkouts']:>9}")
