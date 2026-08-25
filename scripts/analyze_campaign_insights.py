import json
import ssl
import urllib.request
import urllib.parse

ACCESS_TOKEN = "EAAWMnrVYZAnsBST3OvASwfooyQeaZCbcXK4Ue0QHRvFjq63ecxSNKI5Rdo4WJMtr2C5Lc89lE729mPAY6mFIZBgxYTZBXwYMFXW5K7e67xAOkcJeuPIjYq68VInmQCiZAT5ZB1ngDBJpJfZAF2SbNvannd1pGSJAmPXXZC6WGv9fZCIoFEj8gmDUz4zoHOUTO0pZBZClV9B7bANJwuwErr6ryUZCETYUwVUOZCYa3sUEcdGTjuBXwq4Ji7erRmr4JqjSpeQDciXyZAUg3QEe83340VvtrgpU5DNiaDw75xslXAwwZDZD"
ACCOUNT_ID = "act_1626088674941828"
CAMPAIGN_ID = "120247805503880218"

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
    except Exception as e:
        print(f"API Get error on {endpoint}: {e}")
        return None

print("=== 1. MÉTRICAS GERAIS DA CAMPANHA ===")
camp_insights = api_get(f"{CAMPAIGN_ID}/insights", {
    "fields": "spend,impressions,reach,clicks,cpc,ctr,cpm,actions,cost_per_action_type",
    "date_preset": "today"
})
print("Campanha Hoje:", json.dumps(camp_insights, indent=2, ensure_ascii=False))

print("\n=== 2. MÉTRICAS POR CONJUNTO DE ANÚNCIOS (ADSETS) ===")
adsets_insights = api_get(f"{CAMPAIGN_ID}/insights", {
    "fields": "adset_name,adset_id,spend,impressions,reach,clicks,cpc,ctr,cpm,actions",
    "level": "adset",
    "date_preset": "today"
})
print("AdSets Hoje:", json.dumps(adsets_insights, indent=2, ensure_ascii=False))

print("\n=== 3. TOP ANÚNCIOS MAIS ENGAJADOS ===")
ads_insights = api_get(f"{CAMPAIGN_ID}/insights", {
    "fields": "ad_name,ad_id,adset_name,spend,impressions,clicks,cpc,ctr,actions",
    "level": "ad",
    "date_preset": "today"
})
print("Anúncios Hoje:", json.dumps(ads_insights, indent=2, ensure_ascii=False))
