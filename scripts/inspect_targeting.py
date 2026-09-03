import urllib.request
import urllib.parse
import json
import ssl

ssl_context = ssl._create_unverified_context()
ACCESS_TOKEN = "EAAWMnrVYZAnsBSarZBgZAKa8ZAF1eN7PNEhrBRbpqpTytmsgjx0BVer2DYFkTCPq0b90nTseLDmKMfRLHfSvk5wk8DPrUwp6CAxNUqE5jZAXQgxxdw05l2cOaXtNAQTHRxXmpDjdZBiGOHDZCvk8rGzLmEsDZCqISJEB9ZBiGfZBhisJzBgE2Gt0NQOZCMr9pIH1efFZBOJZCvqsaPfRDP1gB6tGtkxORSZCk5M6wmVFkd0a4CRYby8ma60MGZBPAzSHSXeisllD4gwyqilOsxaMafTZBBqm0YCAAZBvAH0PEnQ2vCQZDZD"

def api_get(url, params):
    params['access_token'] = ACCESS_TOKEN
    query = urllib.parse.urlencode(params)
    full_url = f"{url}?{query}"
    req = urllib.request.Request(full_url)
    try:
        with urllib.request.urlopen(req, context=ssl_context) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print("Error Body:", e.read().decode())
        raise

def main():
    url = "https://graph.facebook.com/v20.0/120247805507790218"
    params = {"fields": "id,name,targeting,promoted_object,optimization_goal,billing_event,bid_strategy"}
    data = api_get(url, params)
    print("=== ADSET 02 FULL DATA ===")
    print(json.dumps(data, indent=2))

    url_ad5 = "https://graph.facebook.com/v20.0/120247904073420218"
    params_ad5 = {"fields": "id,name,targeting,promoted_object,optimization_goal,billing_event,bid_strategy,destination_type"}
    data_ad5 = api_get(url_ad5, params_ad5)
    print("\n=== ADSET 05 FULL DATA ===")
    print(json.dumps(data_ad5, indent=2))

if __name__ == "__main__":
    main()
