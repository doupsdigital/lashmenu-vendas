import json
import ssl
import urllib.request
import urllib.parse

ACCESS_TOKEN = "EAAWMnrVYZAnsBSeumvX1TDm62FAjE4MlJoXYwOJZAxQ5AuTlu6lJcVeZBOD5EEUWSalWjvPxwfm1m3lgoh9nP1uwhhliHpIiXcl7ZAvUqHEzVZBYa3HfRIMtn0OiGCyihob0nyIAkoEwZA8gHzu0AiKj4smOVr7Y3IMYaqXCMTC2KGUmvZCZAZBw4MiqRFDnwlsvOPZA4RPOn9aA0ppCs8UJFU4nZBZACCwPLDQc2NGDjiw1piNv8IBrfr7nNnnQrJtKk1BVdfohvYWnaD1fe306RswC2kH7yhX36JZBg1bgshgZDZD"
ACCOUNT_ID = "act_1626088674941828"

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
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"HTTP Error {e.code} on {endpoint}: {err_body}")
        return None

print("==================================================")
print("  1. RESUMO DA CONTA & CAMPANHA (VISÃO GERAL)")
print("==================================================")

account_insights = api_get(f"{ACCOUNT_ID}/insights", {
    "date_preset": "maximum",
    "fields": "spend,impressions,reach,clicks,cpc,cpm,ctr,inline_link_clicks,inline_link_click_ctr,cost_per_inline_link_click,actions"
})

print("Account Insights:", json.dumps(account_insights, indent=2))

print("\n==================================================")
print("  2. METRICAS POR CONJUNTO DE ANÚNCIOS (ADSETS)")
print("==================================================")

adsets_insights = api_get(f"{ACCOUNT_ID}/insights", {
    "date_preset": "maximum",
    "level": "adset",
    "fields": "adset_id,adset_name,spend,impressions,reach,clicks,cpc,cpm,ctr,inline_link_clicks,cost_per_inline_link_click,actions"
})

print("AdSets Insights:", json.dumps(adsets_insights, indent=2))

print("\n==================================================")
print("  3. METRICAS POR ANÚNCIO INDIVIDUAL (ADS)")
print("==================================================")

ads_insights = api_get(f"{ACCOUNT_ID}/insights", {
    "date_preset": "maximum",
    "level": "ad",
    "fields": "ad_id,ad_name,adset_id,adset_name,spend,impressions,clicks,cpc,cpm,ctr,inline_link_clicks,cost_per_inline_link_click,actions"
})

print("Ads Insights:", json.dumps(ads_insights, indent=2))
