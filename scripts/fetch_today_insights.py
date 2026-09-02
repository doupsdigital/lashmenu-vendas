import urllib.request
import urllib.parse
import json
import ssl

ssl_context = ssl._create_unverified_context()

ACCESS_TOKEN = "EAAWMnrVYZAnsBSaud6baT87vZBAbNjKE9fKHr3zoP43iFZAfMvZC0DnhBSCcdPVmZCL0NZB8nRGRZC4NsLzbqrzZCydZAzfM2wSlqEdDUZBiR0tfXe8zguVxRq5B8hb5XGiSaqVpbivsUuw2B8GEtXXOhNlBVFgwk0dQSoOR9YMq3ZCEwrdmeZBQ4ZAeJSRrO7FVyUh23ZCnxbNZCljJJ2xhlgDzbSHhOyYyzJBo5ZCxm3uCKhp2yoEg5HsrCad2lZBOE35z2QlnrWdFBZB30EncoPbgblSR58wHKUjdp1CJ4hwkCsZAQZDZD"
ACCOUNT_ID = "act_1626088674941828"
CAMPAIGN_ID = "120247805503880218"

def get_json(url, params):
    query = urllib.parse.urlencode(params)
    full_url = f"{url}?{query}"
    req = urllib.request.Request(full_url)
    with urllib.request.urlopen(req, context=ssl_context) as response:
        return json.loads(response.read().decode())

def main():
    # 1. Fetch AdSets Insights for today
    url = f"https://graph.facebook.com/v20.0/{CAMPAIGN_ID}/insights"
    params = {
        "access_token": ACCESS_TOKEN,
        "date_preset": "today",
        "level": "adset",
        "fields": "adset_id,adset_name,spend,impressions,reach,clicks,inline_link_clicks,cpc,ctr,actions,cost_per_action_type"
    }
    data = get_json(url, params)
    print("=== ADSET INSIGHTS TODAY ===")
    print(json.dumps(data, indent=2))

    # 2. Fetch AdSets config
    url_adsets = f"https://graph.facebook.com/v20.0/{CAMPAIGN_ID}/adsets"
    params_adsets = {
        "access_token": ACCESS_TOKEN,
        "fields": "id,name,status,daily_budget,optimization_goal,destination_type,promoted_object"
    }
    r_adsets = get_json(url_adsets, params_adsets)
    print("\n=== ADSETS CONFIG ===")
    print(json.dumps(r_adsets, indent=2))

    # 3. Fetch Ads Insights for today
    url_ads = f"https://graph.facebook.com/v20.0/{CAMPAIGN_ID}/insights"
    params_ads = {
        "access_token": ACCESS_TOKEN,
        "date_preset": "today",
        "level": "ad",
        "fields": "ad_id,ad_name,adset_name,spend,impressions,clicks,inline_link_clicks,cpc,ctr,actions"
    }
    r_ads = get_json(url_ads, params_ads)
    print("\n=== AD INSIGHTS TODAY ===")
    print(json.dumps(r_ads, indent=2))

if __name__ == "__main__":
    main()
