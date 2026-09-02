import urllib.request
import urllib.parse
import json
import hashlib
import time
import ssl

ssl_context = ssl._create_unverified_context()

ACCESS_TOKEN = "EAAWMnrVYZAnsBSaud6baT87vZBAbNjKE9fKHr3zoP43iFZAfMvZC0DnhBSCcdPVmZCL0NZB8nRGRZC4NsLzbqrzZCydZAzfM2wSlqEdDUZBiR0tfXe8zguVxRq5B8hb5XGiSaqVpbivsUuw2B8GEtXXOhNlBVFgwk0dQSoOR9YMq3ZCEwrdmeZBQ4ZAeJSRrO7FVyUh23ZCnxbNZCljJJ2xhlgDzbSHhOyYyzJBo5ZCxm3uCKhp2yoEg5HsrCad2lZBOE35z2QlnrWdFBZB30EncoPbgblSR58wHKUjdp1CJ4hwkCsZAQZDZD"
PIXEL_ID = "1042165951490026"

def hash_data(value):
    val_clean = str(value).strip().lower()
    return hashlib.sha256(val_clean.encode('utf-8')).hexdigest()

def send_capi_event(phone_number, first_name="Gabriele", event_name="Purchase", value=89.0):
    # Format phone to E.164 without plus: 554188651722
    phone_clean = ''.join(filter(str.isdigit, phone_number))
    
    payload = {
        "data": [
            {
                "event_name": event_name,
                "event_time": int(time.time()),
                "action_source": "other",
                "user_data": {
                    "ph": [hash_data(phone_clean)],
                    "fn": [hash_data(first_name)]
                },
                "custom_data": {
                    "currency": "BRL",
                    "value": float(value)
                }
            }
        ],
        "access_token": ACCESS_TOKEN
    }

    url = f"https://graph.facebook.com/v20.0/{PIXEL_ID}/events"
    data_bytes = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data_bytes, headers={'Content-Type': 'application/json'})

    try:
        with urllib.request.urlopen(req, context=ssl_context) as response:
            res_json = json.loads(response.read().decode())
            print("=== META CAPI EVENT RESPONSE ===")
            print(json.dumps(res_json, indent=2))
            return res_json
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        print("=== CAPI ERROR ===")
        print(err_body)
        return json.loads(err_body)

if __name__ == "__main__":
    # Test sending conversion for Gabriele Buginski (554188651722)
    print("Enviando evento de conversao CAPI para o Meta Ads...")
    send_capi_event("554188651722", first_name="gabriele", event_name="Purchase", value=89.0)
