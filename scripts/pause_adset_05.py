import json
import ssl
import urllib.request

ACCESS_TOKEN = "EAAWMnrVYZAnsBSbeLrkbIac1LhKkKdYtQ7CY810ZAXhoWYQJDqlYZB97Bh6VZAUvZA1dHAt0FQkc7YhkYjDPKKJodZAvTkZAbluarxBt0uwDBZBrqRYbcaEu0zJFUbyGVBZCsMOH0IuFe78zZCHobaZCibSB7pZBnRbesQOh0kKIej6mWYYgeioZBZCib95AqHhPweRn9jsiQ19a4HTxhfVtm0yo2dJXKWZBYxY7NxfGW2zSRoAuFNOimH4HlZB8rzygKVHZB7y9umsTwlDU5ZA3v6tZAu43MQyzdVYuitAMWnB2h9d5AZDZD"
ADSET_ID = "120247904073420218"

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

url = f"https://graph.facebook.com/v20.0/{ADSET_ID}"
data = json.dumps({"status": "PAUSED", "access_token": ACCESS_TOKEN}).encode("utf-8")

req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req, context=ssl_ctx) as resp:
        print("PAUSED ADSET 05 SUCCESSFULLY:", resp.read().decode("utf-8"))
except Exception as e:
    print("ERROR PAUSING ADSET:", e)
