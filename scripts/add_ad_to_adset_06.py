import urllib.request
import urllib.parse
import json
import ssl

ssl_context = ssl._create_unverified_context()

ACCESS_TOKEN = "EAAWMnrVYZAnsBSarZBgZAKa8ZAF1eN7PNEhrBRbpqpTytmsgjx0BVer2DYFkTCPq0b90nTseLDmKMfRLHfSvk5wk8DPrUwp6CAxNUqE5jZAXQgxxdw05l2cOaXtNAQTHRxXmpDjdZBiGOHDZCvk8rGzLmEsDZCqISJEB9ZBiGfZBhisJzBgE2Gt0NQOZCMr9pIH1efFZBOJZCvqsaPfRDP1gB6tGtkxORSZCk5M6wmVFkd0a4CRYby8ma60MGZBPAzSHSXeisllD4gwyqilOsxaMafTZBBqm0YCAAZBvAH0PEnQ2vCQZDZD"
ACCOUNT_ID = "act_1626088674941828"

ADSET_05_ID = "120247904073420218"
ADSET_06_ID = "120247934284370218"

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
    print("=== 1. BUSCANDO ANÚNCIO E CRIATIVO DO ADSET 05 ===")
    url_ads_05 = f"https://graph.facebook.com/v20.0/{ADSET_05_ID}/ads"
    ads_05 = api_get(url_ads_05, {"fields": "id,name,creative{id,name}"})['data']
    
    if not ads_05:
        print("❌ Nenhum anúncio encontrado no AdSet 05.")
        return

    ad_05 = ads_05[0]
    creative_id = ad_05['creative']['id']
    ad_name = ad_05['name']
    print(f"✅ Anúncio Origem: {ad_name} ({ad_05['id']}) | Criativo ID: {creative_id}")

    print("\n=== 2. CRIANDO ANÚNCIO NO ADSET 06 (IGUAL AO ADSET 05) ===")
    ad_payload = {
        "name": ad_name,
        "adset_id": ADSET_06_ID,
        "creative": json.dumps({"creative_id": creative_id}),
        "status": "ACTIVE"
    }
    
    res_ad = api_post(f"https://graph.facebook.com/v20.0/{ACCOUNT_ID}/ads", ad_payload)
    print("=== RESPOSTA DA CRIAÇÃO DO ANÚNCIO ===")
    print(json.dumps(res_ad, indent=2))
    
    # 3. Ensure AdSet 06 is ACTIVE
    api_post(f"https://graph.facebook.com/v20.0/{ADSET_06_ID}", {"status": "ACTIVE"})
    print("✅ AdSet 06 ativado com sucesso!")

if __name__ == "__main__":
    main()
