import json
import ssl
import urllib.request

ACCESS_TOKEN = "EAAWMnrVYZAnsBSeumvX1TDm62FAjE4MlJoXYwOJZAxQ5AuTlu6lJcVeZBOD5EEUWSalWjvPxwfm1m3lgoh9nP1uwhhliHpIiXcl7ZAvUqHEzVZBYa3HfRIMtn0OiGCyihob0nyIAkoEwZA8gHzu0AiKj4smOVr7Y3IMYaqXCMTC2KGUmvZCZAZBw4MiqRFDnwlsvOPZA4RPOn9aA0ppCs8UJFU4nZBZACCwPLDQc2NGDjiw1piNv8IBrfr7nNnnQrJtKk1BVdfohvYWnaD1fe306RswC2kH7yhX36JZBg1bgshgZDZD"
ACCOUNT_ID = "act_1626088674941828"

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

url_account = f"https://graph.facebook.com/v20.0/{ACCOUNT_ID}/insights?date_preset=maximum&fields=spend,impressions,reach,clicks,cpc,cpm,ctr,inline_link_clicks,cost_per_inline_link_click,actions,action_values&access_token={ACCESS_TOKEN}"
req = urllib.request.Request(url_account)
with urllib.request.urlopen(req, context=ssl_ctx) as resp:
    data = json.loads(resp.read().decode("utf-8"))
    print(json.dumps(data, indent=2))
