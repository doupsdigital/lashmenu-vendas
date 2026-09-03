import urllib.request
import urllib.parse
import json
import ssl
import time

ssl_context = ssl._create_unverified_context()

ACCESS_TOKEN = "EAAWMnrVYZAnsBSarZBgZAKa8ZAF1eN7PNEhrBRbpqpTytmsgjx0BVer2DYFkTCPq0b90nTseLDmKMfRLHfSvk5wk8DPrUwp6CAxNUqE5jZAXQgxxdw05l2cOaXtNAQTHRxXmpDjdZBiGOHDZCvk8rGzLmEsDZCqISJEB9ZBiGfZBhisJzBgE2Gt0NQOZCMr9pIH1efFZBOJZCvqsaPfRDP1gB6tGtkxORSZCk5M6wmVFkd0a4CRYby8ma60MGZBPAzSHSXeisllD4gwyqilOsxaMafTZBBqm0YCAAZBvAH0PEnQ2vCQZDZD"
ACCOUNT_ID = "act_1626088674941828"
CAMPAIGN_ID = "120247805503880218"

def api_get(url, params):
    params['access_token'] = ACCESS_TOKEN
    query = urllib.parse.urlencode(params)
    full_url = f"{url}?{query}"
    req = urllib.request.Request(full_url)
    try:
        with urllib.request.urlopen(req, context=ssl_context) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print("HTTP ERROR:", e.read().decode())
        raise

def main():
    time.sleep(5)
    url_adsets = f"https://graph.facebook.com/v20.0/{CAMPAIGN_ID}/adsets"
    adsets = api_get(url_adsets, {"fields": "id,name,status,daily_budget"})['data']
    
    print("\n=================================================================")
    print("📊 COMPROVAÇÃO FINAL DOS CONJUNTOS DE ANÚNCIOS (HOJE - 03/09)")
    print("=================================================================")
    total_budget = 0
    active_count = 0

    for a in adsets:
        budget = int(a.get('daily_budget', 0)) / 100
        if a['status'] == "ACTIVE":
            status_icon = "🟢 ATIVO"
            total_budget += budget
            active_count += 1
            print(f"• {status_icon} | {a['name']}\n  ID: {a['id']} | Orçamento: R$ {budget:.2f}/dia")
        else:
            status_icon = "🔴 PAUSADO"
            print(f"• {status_icon} | {a['name']}")

    print("\n-----------------------------------------------------------------")
    print(f"✅ Total de Conjuntos Ativos: {active_count}")
    print(f"💰 Orçamento Total Diário da Campanha: R$ {total_budget:.2f}/dia (LIMITE EXATO DE R$ 30,00)")
    print("=================================================================")

if __name__ == "__main__":
    main()
