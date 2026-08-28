import urllib.request
import json
import os
import sys
import time
import tempfile
import subprocess
import imageio_ffmpeg

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = "https://wffhptpsafllsmcsoiih.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmZmhwdHBzYWZsbHNtY3NvaWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODkyMTYsImV4cCI6MjEwMjg2NTIxNn0.nwpvIwl8V6_KGIp5e5oeraAcGyt3oo8Kdam2hp6ajSQ"

HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json"
}

def get_ffmpeg_cmd():
    try:
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception as e:
        print(f"❌ FFmpeg não localizado: {e}")
        return None

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

def upload_to_supabase_storage(bucket, path, file_bytes, content_type="video/mp4"):
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": content_type,
        "cache-control": "max-age=31536000",
        "x-upsert": "true"
    }
    req = urllib.request.Request(upload_url, data=file_bytes, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            if resp.status in (200, 201):
                return f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}"
    except Exception as e:
        print(f"❌ Erro ao enviar para o Storage [{path}]: {e}")
    return None

def transcode_video(ffmpeg_path, input_file_path):
    temp_dir = tempfile.mkdtemp()
    out_video_path = os.path.join(temp_dir, "optimized.mp4")
    out_poster_path = os.path.join(temp_dir, "poster.webp")
    
    # 1. Transcode de Vídeo: 720p max, H.264 CRF 28, sem áudio, streaming rápido (+faststart)
    cmd_video = [
        ffmpeg_path, "-y",
        "-i", input_file_path,
        "-vf", "scale='min(720,iw)':-2",
        "-c:v", "libx264",
        "-crf", "28",
        "-preset", "faster",
        "-an",
        "-movflags", "+faststart",
        out_video_path
    ]
    
    # 2. Extração de Imagem de Poster (frame 1)
    cmd_poster = [
        ffmpeg_path, "-y",
        "-i", input_file_path,
        "-vf", "scale='min(1200,iw)':-2",
        "-vframes", "1",
        "-f", "image2",
        "-c:v", "libwebp",
        "-quality", "82",
        out_poster_path
    ]
    
    try:
        subprocess.run(cmd_video, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        subprocess.run(cmd_poster, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        
        with open(out_video_path, "rb") as f:
            video_bytes = f.read()
            
        with open(out_poster_path, "rb") as f:
            poster_bytes = f.read()
            
        return video_bytes, poster_bytes
    except Exception as e:
        print(f"  ❌ Falha no transcode via FFmpeg: {e}")
        return None, None
    finally:
        try:
            if os.path.exists(out_video_path): os.remove(out_video_path)
            if os.path.exists(out_poster_path): os.remove(out_poster_path)
            os.rmdir(temp_dir)
        except Exception:
            pass

def run_video_optimization(target_slug=None):
    ffmpeg_path = get_ffmpeg_cmd()
    if not ffmpeg_path:
        return
    
    print("🎬 Iniciando Motor de Otimização & Transcode de Vídeos (FFmpeg)...\n")
    
    orders_url = f"{SUPABASE_URL}/rest/v1/orders?select=*"
    if target_slug:
        orders_url += f"&slug=eq.{urllib.parse.quote(target_slug)}"
        
    orders = make_request(orders_url) or []
    video_orders = [o for o in orders if o.get("cover_media_type") == "video" or (o.get("cover_media_url") and any(ext in o.get("cover_media_url").lower() for ext in [".mp4", ".mov", ".webm"]))]
    
    if not video_orders:
        print("ℹ️ Nenhum vídeo de capa pesado pendente de otimização no Supabase.")
        return
        
    total_videos = 0
    total_orig_bytes = 0
    total_opt_bytes = 0

    for order in video_orders:
        slug = order.get("slug")
        order_id = order.get("id")
        cover_url = order.get("cover_media_url")
        client_name = order.get("client_name") or slug
        
        print(f"🎥 Processando Vídeo de Capa: [{client_name}] ({slug})")
        print(f"  ⬇️ Baixando arquivo original: {cover_url[:65]}...")
        
        try:
            with urllib.request.urlopen(cover_url) as resp:
                raw_bytes = resp.read()
                
            orig_size = len(raw_bytes)
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp_in:
                tmp_in.write(raw_bytes)
                tmp_in_path = tmp_in.name
                
            print("  ⚡ Transcodificando para 720p H.264 + Gerando Imagem de Poster...")
            opt_video_bytes, opt_poster_bytes = transcode_video(ffmpeg_path, tmp_in_path)
            
            try:
                os.remove(tmp_in_path)
            except Exception:
                pass

            if opt_video_bytes and opt_poster_bytes:
                opt_size = len(opt_video_bytes)
                ts = int(time.time())
                
                # Upload do Vídeo Otimizado MP4
                vid_path = f"covers/{slug}-cover-video-{ts}.mp4"
                opt_vid_url = upload_to_supabase_storage("catalog-assets", vid_path, opt_video_bytes, content_type="video/mp4")
                
                # Upload da Imagem de Poster WebP
                poster_path = f"covers/{slug}-cover-poster-{ts}.webp"
                opt_poster_url = upload_to_supabase_storage("catalog-assets", poster_path, opt_poster_bytes, content_type="image/webp")
                
                if opt_vid_url and opt_poster_url:
                    # Atualiza banco de dados
                    patch_url = f"{SUPABASE_URL}/rest/v1/orders?id=eq.{order_id}"
                    make_request(patch_url, method="PATCH", data={
                        "cover_media_url": opt_vid_url,
                        "cover_poster_url": opt_poster_url,
                        "cover_media_type": "video"
                    })
                    
                    reduction = (1 - (opt_size / orig_size)) * 100
                    print(f"  ✅ Vídeo Otimizado: {orig_size/(1024*1024):.2f} MB -> {opt_size/(1024*1024):.2f} MB (-{reduction:.1f}%)")
                    print(f"  🖼️ Poster Gerado: {len(opt_poster_bytes)/1024:.1f} KB")
                    
                    total_videos += 1
                    total_orig_bytes += orig_size
                    total_opt_bytes += opt_size
        except Exception as e:
            print(f"  ❌ Erro ao processar vídeo de {slug}: {e}")

    print("\n========================================")
    print("✨ RELATÓRIO DE OTIMIZAÇÃO DE VÍDEOS:")
    print(f"  - Vídeos Processados: {total_videos}")
    if total_orig_bytes > 0:
        orig_mb = total_orig_bytes / (1024 * 1024)
        opt_mb = total_opt_bytes / (1024 * 1024)
        saved_mb = orig_mb - opt_mb
        reduction = (1 - (total_opt_bytes / total_orig_bytes)) * 100
        print(f"  - Tamanho Original Total: {orig_mb:.2f} MB")
        print(f"  - Tamanho Otimizado Total: {opt_mb:.2f} MB")
        print(f"  - Economia de Banda: {saved_mb:.2f} MB economizados (-{reduction:.1f}%)")
    print("========================================\n")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else None
    run_video_optimization(target)
