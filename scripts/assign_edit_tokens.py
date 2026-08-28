import urllib.request
import json
import hashlib
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = "https://wffhptpsafllsmcsoiih.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmZmhwdHBzYWZsbHNtY3NvaWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODkyMTYsImV4cCI6MjEwMjg2NTIxNn0.nwpvIwl8V6_KGIp5e5oeraAcGyt3oo8Kdam2hp6ajSQ"

HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json"
}

def make_request(url, method="GET", data=None):
    req_headers = HEADERS.copy()
    body = json.dumps(data).encode("utf-8") if data is not None and isinstance(data, (dict, list)) else data
    req = urllib.request.Request(url, data=body, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read()
            if content:
                try:
                    return json.loads(content.decode("utf-8"))
                except Exception:
                    return content
            return True
    except Exception as e:
        print(f"❌ Erro na requisição [{method} {url}]: {e}")
        return None

def generate_edit_token(order_id, slug):
    clean_slug = (slug or "catalogo").replace("-", "").replace("_", "").lower()
    raw = f"{order_id}_lashmenu_secret_salt_2026"
    h = hashlib.sha256(raw.encode()).hexdigest()[:6]
    return f"sec_{clean_slug}_{h}"

def assign_tokens():
    print("🔑 Verificando e Listando Links Mágicos de Edição no Supabase...\n")
    
    orders = make_request(f"{SUPABASE_URL}/rest/v1/orders?select=*") or []
    if not orders:
        print("Nenhum catálogo encontrado.")
        return
        
    for order in orders:
        slug = order.get("slug")
        order_id = order.get("id")
        client_name = order.get("client_name") or slug
        token = generate_edit_token(order_id, slug)
        
        edit_url = f"https://{slug}.lashmenu.com/editar?token={token}"
        print(f"  ✨ [{client_name}] ({slug})")
        print(f"     👉 Link de Edição: {edit_url}\n")
            
    print(f"✨ Processamento Concluído! Todos os {len(orders)} catálogos possuem Links Mágicos determinísticos válidos.")

if __name__ == "__main__":
    assign_tokens()
