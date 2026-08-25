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

print("=== CRIANDO REGRAS AUTOMATIZADAS NA META ===")

# 1. Regra para Ligar às 05:00 AM
rule_turn_on = {
    "name": "[LASHMENU] Automação — Ligar 05:00 AM",
    "status": "ENABLED",
    "evaluation_spec": json.dumps({
        "evaluation_type": "SCHEDULE",
        "filters": [
            {"field": "campaign.id", "operator": "EQUAL", "value": [CAMPAIGN_ID]},
            {"field": "entity_type", "operator": "EQUAL", "value": "ADSET"}
        ]
    }),
    "schedule_spec": json.dumps({
        "schedule_type": "DAILY",
        "schedule": [
            {"days": [0, 1, 2, 3, 4, 5, 6], "start_minute": 300, "end_minute": 300}
        ]
    }),
    "execution_spec": json.dumps({
        "execution_type": "UNPAUSE"
    })
}

res_on = api_post(f"{ACCOUNT_ID}/adrules_library", rule_turn_on)
print("✅ Regra Ligar 05:00 AM:", res_on)

# 2. Regra para Pausar às 00:00 (Meia-Noite)
rule_turn_off = {
    "name": "[LASHMENU] Automação — Pausar 00:00 AM",
    "status": "ENABLED",
    "evaluation_spec": json.dumps({
        "evaluation_type": "SCHEDULE",
        "filters": [
            {"field": "campaign.id", "operator": "EQUAL", "value": [CAMPAIGN_ID]},
            {"field": "entity_type", "operator": "EQUAL", "value": "ADSET"}
        ]
    }),
    "schedule_spec": json.dumps({
        "schedule_type": "DAILY",
        "schedule": [
            {"days": [0, 1, 2, 3, 4, 5, 6], "start_minute": 0, "end_minute": 0}
        ]
    }),
    "execution_spec": json.dumps({
        "execution_type": "PAUSE"
    })
}

res_off = api_post(f"{ACCOUNT_ID}/adrules_library", rule_turn_off)
print("✅ Regra Pausar 00:00 AM:", res_off)
