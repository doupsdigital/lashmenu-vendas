import urllib.request
import json
import io
import time
import sys
from PIL import Image, ImageOps

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = "https://wffhptpsafllsmcsoiih.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmZmhwdHBzYWZsbHNtY3NvaWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODkyMTYsImV4cCI6MjEwMjg2NTIxNn0.nwpvIwl8V6_KGIp5e5oeraAcGyt3oo8Kdam2hp6ajSQ"

HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json"
}

def make_request(url, method="GET", data=None, extra_headers=None):
    req_headers = HEADERS.copy()
    if extra_headers:
        req_headers.update(extra_headers)
    
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
        print(f"  ❌ Erro na requisição [{method} {url}]: {e}")
        return None

def compress_image_bytes(image_bytes, max_dim=1200, quality=82):
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img = ImageOps.exif_transpose(img) # Corrige orientação do celular
        
        # Converte modos de cor especiais
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGBA")
        else:
            img = img.convert("RGB")
        
        width, height = img.size
        if width > max_dim or height > max_dim:
            if width > height:
                height = int((height * max_dim) / width)
                width = max_dim
            else:
                width = int((width * max_dim) / height)
                height = max_dim
            img = img.resize((width, height), Image.Resampling.LANCZOS)
        
        out = io.BytesIO()
        img.save(out, format="WEBP", quality=quality, optimize=True)
        return out.getvalue()
    except Exception as e:
        print(f"  ⚠️ Erro na compressão da imagem: {e}")
        return None

def upload_to_supabase_storage(bucket, path, file_bytes):
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "image/webp",
        "cache-control": "max-age=31536000",
        "x-upsert": "true"
    }
    req = urllib.request.Request(upload_url, data=file_bytes, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            if resp.status in (200, 201):
                return f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}"
    except Exception as e:
        print(f"  ❌ Erro ao enviar para o Storage [{path}]: {e}")
    return None

def run_optimization(target_slug=None):
    print("🚀 Iniciando Otimização de Imagens Existentes no Supabase...\n")
    
    # 1. Busca Pedidos
    orders_url = f"{SUPABASE_URL}/rest/v1/orders?select=*"
    if target_slug:
        orders_url += f"&slug=eq.{urllib.parse.quote(target_slug)}"
    
    orders = make_request(orders_url)
    if not orders:
        print("Nenhum pedido encontrado.")
        return
    
    total_images_processed = 0
    total_original_bytes = 0
    total_compressed_bytes = 0

    for order in orders:
        slug = order.get("slug")
        order_id = order.get("id")
        client_name = order.get("client_name") or slug
        print(f"📦 Processando Catálogo: [{client_name}] ({slug}) - ID: {order_id}")
        
        # --- A. Otimização da Foto de Capa ---
        cover_url = order.get("cover_media_url")
        if cover_url and "catalog-assets" in cover_url and not cover_url.endswith(".webp") and not cover_url.endswith(".mp4"):
            try:
                print(f"  📸 Baixando Capa Original: {cover_url[:60]}...")
                with urllib.request.urlopen(cover_url) as resp:
                    raw_bytes = resp.read()
                
                orig_size = len(raw_bytes)
                compressed = compress_image_bytes(raw_bytes, max_dim=1200, quality=82)
                
                if compressed and len(compressed) < orig_size:
                    comp_size = len(compressed)
                    new_path = f"covers/{slug}-cover-opt-{int(time.time())}.webp"
                    new_url = upload_to_supabase_storage("catalog-assets", new_path, compressed)
                    
                    if new_url:
                        # Atualiza registro no banco
                        patch_url = f"{SUPABASE_URL}/rest/v1/orders?id=eq.{order_id}"
                        make_request(patch_url, method="PATCH", data={"cover_media_url": new_url, "cover_media_type": "image"})
                        
                        reduction = (1 - (comp_size / orig_size)) * 100
                        print(f"  ✅ Capa Otimizada: {orig_size/1024:.1f} KB -> {comp_size/1024:.1f} KB (-{reduction:.1f}%)")
                        total_images_processed += 1
                        total_original_bytes += orig_size
                        total_compressed_bytes += comp_size
                else:
                    print("  ℹ️ Capa já estava otimizada ou menor que o resultado.")
            except Exception as e:
                print(f"  ⚠️ Erro ao processar capa: {e}")
        
        # --- B. Otimização dos Procedimentos ---
        services_url = f"{SUPABASE_URL}/rest/v1/order_services?order_id=eq.{order_id}&select=*"
        services = make_request(services_url) or []
        
        for svc in services:
            svc_id = svc.get("id")
            svc_name = svc.get("name") or "Procedimento"
            photo_url = svc.get("photo_url")
            
            if photo_url and "catalog-assets" in photo_url and not photo_url.endswith(".webp"):
                try:
                    print(f"  🔍 Baixando Foto [{svc_name}]: {photo_url[:60]}...")
                    with urllib.request.urlopen(photo_url) as resp:
                        raw_bytes = resp.read()
                    
                    orig_size = len(raw_bytes)
                    compressed = compress_image_bytes(raw_bytes, max_dim=800, quality=82)
                    
                    if compressed and len(compressed) < orig_size:
                        comp_size = len(compressed)
                        new_path = f"services/{slug}-svc-{svc_id}-opt-{int(time.time())}.webp"
                        new_url = upload_to_supabase_storage("catalog-assets", new_path, compressed)
                        
                        if new_url:
                            # Atualiza registro no banco
                            patch_url = f"{SUPABASE_URL}/rest/v1/order_services?id=eq.{svc_id}"
                            make_request(patch_url, method="PATCH", data={"photo_url": new_url})
                            
                            reduction = (1 - (comp_size / orig_size)) * 100
                            print(f"  ✅ Procedimento [{svc_name}] Otimizado: {orig_size/1024:.1f} KB -> {comp_size/1024:.1f} KB (-{reduction:.1f}%)")
                            total_images_processed += 1
                            total_original_bytes += orig_size
                            total_compressed_bytes += comp_size
                except Exception as e:
                    print(f"  ⚠️ Erro ao processar foto do procedimento [{svc_name}]: {e}")

    print("\n========================================")
    print("✨ RELATÓRIO FINAL DE OTIMIZAÇÃO:")
    print(f"  - Imagens Otimizadas: {total_images_processed}")
    if total_original_bytes > 0:
        orig_mb = total_original_bytes / (1024 * 1024)
        comp_mb = total_compressed_bytes / (1024 * 1024)
        saved_mb = orig_mb - comp_mb
        total_reduction = (1 - (total_compressed_bytes / total_original_bytes)) * 100
        print(f"  - Tamanho Original Total: {orig_mb:.2f} MB")
        print(f"  - Tamanho Otimizado Total: {comp_mb:.2f} MB")
        print(f"  - Economia de Banda: {saved_mb:.2f} MB economizados (-{total_reduction:.1f}%)")
    print("========================================\n")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else None
    run_optimization(target)
