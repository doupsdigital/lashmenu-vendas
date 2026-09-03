import urllib.request
import urllib.parse
import json
import ssl

ssl_context = ssl._create_unverified_context()

ACCESS_TOKEN = "EAAWMnrVYZAnsBSarZBgZAKa8ZAF1eN7PNEhrBRbpqpTytmsgjx0BVer2DYFkTCPq0b90nTseLDmKMfRLHfSvk5wk8DPrUwp6CAxNUqE5jZAXQgxxdw05l2cOaXtNAQTHRxXmpDjdZBiGOHDZCvk8rGzLmEsDZCqISJEB9ZBiGfZBhisJzBgE2Gt0NQOZCMr9pIH1efFZBOJZCvqsaPfRDP1gB6tGtkxORSZCk5M6wmVFkd0a4CRYby8ma60MGZBPAzSHSXeisllD4gwyqilOsxaMafTZBBqm0YCAAZBvAH0PEnQ2vCQZDZD"
ACCOUNT_ID = "act_1626088674941828"
CAMPAIGN_ID = "120247805503880218"

def api_get(url, params):
    params['access_token'] = ACCESS_TOKEN
    query = urllib.parse.urlencode(params)
    full_url = f"{url}?{query}"
    req = urllib.request.Request(full_url)
    with urllib.request.urlopen(req, context=ssl_context) as response:
        return json.loads(response.read().decode())

def api_post(url, data):
    data['access_token'] = ACCESS_TOKEN
    encoded_data = urllib.parse.urlencode(data).encode('utf-8')
    req = urllib.request.Request(url, data=encoded_data, method='POST')
    with urllib.request.urlopen(req, context=ssl_context) as response:
        return json.loads(response.read().decode())

def main():
    print("=== 1. BUSCANDO CONJUNTOS DA CAMPANHA ===")
    url_adsets = f"https://graph.facebook.com/v20.0/{CAMPAIGN_ID}/adsets"
    params_adsets = {
        "fields": "id,name,status,daily_budget,targeting,creative,optimization_goal,destination_type,promoted_object"
    }
    adsets_res = api_get(url_adsets, params_adsets)
    adsets = adsets_res.get('data', [])
    
    adset_05 = None
    adset_02 = None
    adset_04 = None
    
    for a in adsets:
        name = a.get('name', '')
        print(f"ID: {a['id']} | Nome: {name} | Status: {a['status']} | Orçamento: R$ {int(a.get('daily_budget', 0))/100:.2f}")
        if 'AdSet 05 — WhatsApp Direto X1' in name:
            adset_05 = a
        elif 'AdSet 02 — Interesses' in name or 'AdSet 02' in name:
            adset_02 = a
        elif 'AdSet 04 — Vídeo Reels' in name or 'AdSet 04' in name:
            adset_04 = a

    print("\n--- AdSet 05 Encontrado ---:", adset_05['id'] if adset_05 else "Não")
    print("--- AdSet 02 Encontrado ---:", adset_02['id'] if adset_02 else "Não")
    print("--- AdSet 04 Encontrado ---:", adset_04['id'] if adset_04 else "Não")

    # 2. Inspect targeting of AdSet 02 to copy targeting for the new duplicated AdSet
    if adset_02:
        print("\nTargeting de AdSet 02:")
        print(json.dumps(adset_02.get('targeting', {}), indent=2))
        
    # 3. Inspect Ads inside AdSet 05 & AdSet 02
    url_ads = f"https://graph.facebook.com/v20.0/{CAMPAIGN_ID}/ads"
    params_ads = {
        "fields": "id,name,adset_id,status,creative{id,name,object_story_spec,asset_feed_spec}"
    }
    ads_res = api_get(url_ads, params_ads)
    ads = ads_res.get('data', [])
    print("\n=== ANÚNCIOS DA CAMPANHA ===")
    for ad in ads:
        print(f"Ad ID: {ad['id']} | Nome: {ad['name']} | AdSet ID: {ad['adset_id']} | Status: {ad['status']}")

if __name__ == "__main__":
    main()
