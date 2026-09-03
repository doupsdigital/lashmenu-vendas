import urllib.request
import urllib.parse
import json
import ssl
import sys

ssl_context = ssl._create_unverified_context()

ACCESS_TOKEN = "EAAWMnrVYZAnsBSarZBgZAKa8ZAF1eN7PNEhrBRbpqpTytmsgjx0BVer2DYFkTCPq0b90nTseLDmKMfRLHfSvk5wk8DPrUwp6CAxNUqE5jZAXQgxxdw05l2cOaXtNAQTHRxXmpDjdZBiGOHDZCvk8rGzLmEsDZCqISJEB9ZBiGfZBhisJzBgE2Gt0NQOZCMr9pIH1efFZBOJZCvqsaPfRDP1gB6tGtkxORSZCk5M6wmVFkd0a4CRYby8ma60MGZBPAzSHSXeisllD4gwyqilOsxaMafTZBBqm0YCAAZBvAH0PEnQ2vCQZDZD"
ACCOUNT_ID = "act_1626088674941828"
CAMPAIGN_ID = "120247805503880218"

WA_BRIDGE_URL = "https://lashmenu.com/vendas/wa/"

def log(msg):
    print(msg, flush=True)

def api_get(url, params):
    params['access_token'] = ACCESS_TOKEN
    query = urllib.parse.urlencode(params)
    full_url = f"{url}?{query}"
    req = urllib.request.Request(full_url)
    try:
        with urllib.request.urlopen(req, context=ssl_context) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        log(f"HTTP GET Error {e.code}: {e.read().decode()}")
        raise

def api_post(url, data):
    data['access_token'] = ACCESS_TOKEN
    encoded_data = urllib.parse.urlencode(data).encode('utf-8')
    req = urllib.request.Request(url, data=encoded_data, method='POST')
    try:
        with urllib.request.urlopen(req, context=ssl_context) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        log(f"HTTP POST Error {e.code}: {e.read().decode()}")
        raise

def main():
    log("=================================================================")
    log("🚀 EXECUTANDO REESTRUTURAÇÃO COMPLETA X1 (ORÇAMENTO R$ 30/DIA)")
    log("=================================================================\n")

    # 1. Unpause Campaign
    log("1. Ativando Campanha Mestre...")
    api_post(f"https://graph.facebook.com/v20.0/{CAMPAIGN_ID}", {"status": "ACTIVE"})
    log("✅ Campanha Mestre mantida ATIVA.")

    # 2. Fetch all AdSets
    url_adsets = f"https://graph.facebook.com/v20.0/{CAMPAIGN_ID}/adsets"
    adsets_data = api_get(url_adsets, {"fields": "id,name,status,daily_budget,targeting"})
    adsets = adsets_data.get('data', [])

    adset_05_id = "120247904073420218"
    adset_02_id = "120247805507790218"
    
    adset_02_targeting = None
    for a in adsets:
        if a['id'] == adset_02_id:
            adset_02_targeting = a.get('targeting')

    # Check if AdSet 06 already exists from previous attempt
    adset_06_id = None
    for a in adsets:
        if "AdSet 06" in a['name'] or "Duplicado" in a['name']:
            adset_06_id = a['id']
            break

    # PAUSE ALL SECONDARY/PAUSED ADSETS EXCEPT 05, 02, and 06
    log("\n2. Pausando conjuntos secundários...")
    for a in adsets:
        aid = a['id']
        aname = a['name']
        if aid not in [adset_05_id, adset_02_id, adset_06_id]:
            api_post(f"https://graph.facebook.com/v20.0/{aid}", {"status": "PAUSED"})
            log(f"   🔴 Pausado: {aname} ({aid})")

    if not adset_06_id:
        log("\n3. PASSO 1: Duplicando AdSet 05 para público de Estética & Cílios...")
        dup_url = f"https://graph.facebook.com/v20.0/{adset_05_id}/copies"
        dup_res = api_post(dup_url, {
            "campaign_id": CAMPAIGN_ID,
            "status_option": "ACTIVE"
        })
        adset_06_id = dup_res.get('copied_adset_id') or dup_res.get('id')
        log(f"   ✅ AdSet Duplicado com sucesso! ID: {adset_06_id}")

    # Configure AdSet 06
    adset_06_name = "[LASHMENU] AdSet 06 — WhatsApp Direto X1 (Interesses em Estética & Cílios)"
    update_data_06 = {
        "name": adset_06_name,
        "daily_budget": "1000",
        "status": "ACTIVE"
    }
    if adset_02_targeting:
        update_data_06["targeting"] = json.dumps(adset_02_targeting)
        
    api_post(f"https://graph.facebook.com/v20.0/{adset_06_id}", update_data_06)
    log(f"   ✅ AdSet 06 configurado: R$ 10,00/dia | Status: ACTIVE | Nome: {adset_06_name}")

    # -------------------------------------------------------------------------
    # PASSO 2: AdSet 05 (Aberto Feminino) -> R$ 10,00/dia | ACTIVE
    # -------------------------------------------------------------------------
    log("\n4. PASSO 2: Ajustando AdSet 05 (WhatsApp Direto Aberto)...")
    api_post(f"https://graph.facebook.com/v20.0/{adset_05_id}", {
        "daily_budget": "1000",
        "status": "ACTIVE"
    })
    log("   ✅ AdSet 05 configurado: R$ 10,00/dia | Status: ACTIVE")

    # -------------------------------------------------------------------------
    # PASSO 3: AdSet 02 (Interesses Estética) -> R$ 10,00/dia | ACTIVE | Destino WA
    # -------------------------------------------------------------------------
    log("\n5. PASSO 3: Ajustando AdSet 02 (Interesses em Estética)...")
    api_post(f"https://graph.facebook.com/v20.0/{adset_02_id}", {
        "daily_budget": "1000",
        "status": "ACTIVE"
    })
    log("   ✅ AdSet 02 configurado: R$ 10,00/dia | Status: ACTIVE")

    # Update ads in AdSet 02, 05, 06 to ACTIVE
    log("\n6. Ativando todos os anúncios dos 3 conjuntos ativos...")
    url_ads = f"https://graph.facebook.com/v20.0/{CAMPAIGN_ID}/ads"
    ads_data = api_get(url_ads, {"fields": "id,name,adset_id,status"})
    ads = ads_data.get('data', [])

    for ad in ads:
        ad_id = ad['id']
        adset_id = ad['adset_id']
        ad_name = ad['name']

        if adset_id in [adset_02_id, adset_05_id, adset_06_id]:
            api_post(f"https://graph.facebook.com/v20.0/{ad_id}", {"status": "ACTIVE"})
            log(f"   🟢 Anúncio Ativado: {ad_name} ({ad_id}) no AdSet {adset_id}")

    # -------------------------------------------------------------------------
    # VERIFICAÇÃO FINAL COMPLETA
    # -------------------------------------------------------------------------
    log("\n=================================================================")
    log("📊 VERIFICAÇÃO FINAL DA CAMPANHA (RESUMO FINAL DO DIA 03/09)")
    log("=================================================================")
    final_adsets = api_get(url_adsets, {"fields": "id,name,status,daily_budget"})['data']
    total_budget = 0

    for a in final_adsets:
        status_icon = "🟢 ATIVO" if a['status'] == "ACTIVE" else "🔴 PAUSADO"
        budget = int(a.get('daily_budget', 0)) / 100
        if a['status'] == "ACTIVE":
            total_budget += budget
        log(f"• {status_icon} | {a['name']}\n  ID: {a['id']} | Orçamento: R$ {budget:.2f}/dia\n")

    log(f"💰 ORÇAMENTO TOTAL DIÁRIO DA CAMPANHA ATIVA: R$ {total_budget:.2f}/dia (LIMITE EXATO R$ 30,00)")
    log("=================================================================")

if __name__ == "__main__":
    main()
