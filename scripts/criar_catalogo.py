#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
LashMenu — Motor de Criação Automatizada de Catálogos VIP
=============================================================================
Este script recebe os dados estruturados de uma cliente e:
1. Faz upload da foto de capa para o Supabase Storage (se fornecido arquivo local).
2. Garante a unicidade do slug (subdomínio da cliente).
3. Cria o pedido na tabela 'orders' com status 'pendente_revisao'.
4. Cadastra os procedimentos na tabela 'order_services' mapeando fotos e descrições.
5. Retorna links oficiais de pré-visualização, link do admin e mensagem para o WhatsApp.
=============================================================================
"""

import sys
import os
import json
import re
import mimetypes
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime

# Garante compatibilidade de encoding UTF-8 no terminal Windows (PowerShell/CMD)
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

SUPABASE_URL = "https://wffhptpsafllsmcsoiih.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmZmhwdHBzYWZsbHNtY3NvaWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODkyMTYsImV4cCI6MjEwMjg2NTIxNn0.nwpvIwl8V6_KGIp5e5oeraAcGyt3oo8Kdam2hp6ajSQ"
STORAGE_BUCKET = "catalog-assets"

# Catálogo Canônico de Procedimentos Oficiais do LashMenu
CANONICAL_SERVICES = {
    "volume_brasileiro": {
        "keywords": ["brasileiro", "volume brasileiro", "fio y", "fios em y", "técnica em y", "extensao em y", "y"],
        "name": "Volume Brasileiro",
        "category": "Extensão em Y",
        "duration": "1h30",
        "maintenance": "90,00 (até 20 dias)",
        "description": "Fios tecnológicos em formato Y que proporcionam volume delicado com acabamento uniforme, alta retenção e extrema leveza para o dia a dia.",
        "effect": "Preenchimento, Textura & Leveza",
        "photo_url": "/modelos/glamour-midnight/assets/img/volume-brasileiro.png"
    },
    "classico_fio_a_fio": {
        "keywords": ["classico", "fio a fio", "clássico", "fio-a-fio", "natural", "efeito rímel", "efeito rimel"],
        "name": "Clássico Fio a Fio",
        "category": "Fio a Fio Clássico",
        "duration": "1h30",
        "maintenance": "70,00 (até 18 dias)",
        "description": "Um fio sintético ultrafino acoplado a cada cílio natural saudável. O resultado mais elegante e discreto: olhar iluminado com efeito de rímel perfeito.",
        "effect": "Natural, Discreto & Elegante",
        "photo_url": "/modelos/glamour-midnight/assets/img/classico-fio-a-fio.png"
    },
    "volume_egipcio": {
        "keywords": ["egipcio", "egípcio", "volume egipcio", "volume egípcio", "fio w", "fios em w", "3d w"],
        "name": "Volume Egípcio",
        "category": "Extensão em W",
        "duration": "1h30",
        "maintenance": "95,00 (até 20 dias)",
        "description": "Fios especiais em formato W (3D tecnológico) que proporcionam densidade homogênea, efeito aveludado e volume equilibrado sem pesar nos olhos.",
        "effect": "Densidade Aveludada & Uniforme",
        "photo_url": "/modelos/glamour-midnight/assets/img/volume-egipcio.png"
    },
    "volume_hibrido": {
        "keywords": ["hibrido", "híbrido", "volume hibrido", "volume híbrido", "mix", "fio a fio com volume"],
        "name": "Volume Híbrido",
        "category": "Clássico + Volume",
        "duration": "1h45",
        "maintenance": "95,00 (até 20 dias)",
        "description": "A combinação artesanal entre a delicadeza do fio a fio clássico e leques de volume, criando textura multidimensional, profundidade e brilho no olhar.",
        "effect": "Textura Desconstruída & Volume Sob Medida",
        "photo_url": "/modelos/glamour-midnight/assets/img/volume-hibrido.png"
    },
    "volume_russo": {
        "keywords": ["russo", "volume russo", "fans", "fan", "leques artesanais", "3d a 6d", "3d-6d"],
        "name": "Volume Russo",
        "category": "Fans Artesanais 3D–6D",
        "duration": "2h00",
        "maintenance": "110,00 (até 20 dias)",
        "description": "Técnica de alta precisão com fans ultrafinos (3 a 6 fios de seda) montados à mão na hora. Cria um volume expressivo, extremamente macio, denso e sofisticado.",
        "effect": "Glamour, Densidade & Toque de Pluma",
        "photo_url": "/modelos/glamour-midnight/assets/img/volume-russo.png"
    },
    "mega_volume": {
        "keywords": ["mega", "mega volume", "megavolume", "8d", "10d", "12d", "0.03"],
        "name": "Mega Volume",
        "category": "Densidade Máxima 8D–12D",
        "duration": "2h30",
        "maintenance": "140,00 (até 18 dias)",
        "description": "O ápice da densidade e do impacto visual: leques artesanais com fios ultrafinos de 0.03mm. Proporciona um olhar super pretinho, aveludado e hipnotizante.",
        "effect": "Impacto Máximo, Densidade Total & Preto Profundo",
        "photo_url": "/modelos/glamour-midnight/assets/img/mega-volume.png"
    },
    "fox_eyes": {
        "keywords": ["fox", "fox eyes", "foxy", "foxy eyes", "efeito raposa", "delineado", "canto externo"],
        "name": "Fox Eyes",
        "category": "Mapping Estilizado",
        "duration": "1h45",
        "maintenance": "100,00 (até 20 dias)",
        "description": "Alongamento estratégico com curvaturas graduais no canto externo. Cria um efeito delineado sofisticado que eleva o olhar sem necessidade de maquiagem.",
        "effect": "Olhar Delineado, Marcante & Elevação",
        "photo_url": "/modelos/glamour-midnight/assets/img/fox-eyes.png"
    },
    "lash_lifting": {
        "keywords": ["lifting", "lash lifting", "lash lift", "curvatura natural", "botox de cilios", "botox"],
        "name": "Lash Lifting",
        "category": "Tratamento Natural",
        "duration": "1h00",
        "maintenance": "Incluso",
        "description": "Curvatura e hidratação profunda dos próprios cílios naturais com tintura e queratina botox. Sem fios artificiais, durabilidade de até 6 a 8 semanas.",
        "effect": "Cílios Curvados, Pretos e Nutridos",
        "photo_url": "/modelos/glamour-midnight/assets/img/lash-lifting.png"
    },
    "mapping_boneca": {
        "keywords": ["mapping", "boneca", "gatinho", "esquilo", "visagismo"],
        "name": "Mapping Boneca / Gatinho",
        "category": "Personalização de Olhar",
        "duration": "Design",
        "maintenance": "-",
        "description": "Consultoria de visagismo personalizada para definir o desenho ideal dos fios de acordo com o formato e proporção única dos olhos da cliente.",
        "effect": "Harmonização do Olhar",
        "photo_url": "/modelos/glamour-midnight/assets/img/mapping-boneca.png"
    },
    "remocao": {
        "keywords": ["remocao", "remoção", "retirada", "remover cilios", "remover fios"],
        "name": "Remoção dos Fios",
        "category": "Remoção Segura",
        "duration": "40min",
        "maintenance": "-",
        "description": "Remoção com produto profissional dermatologicamente testado em creme/gel, preservando 100% da integridade e saúde dos cílios naturais.",
        "effect": "Desacoplamento Suave Sem Danos",
        "photo_url": "/modelos/glamour-midnight/assets/img/remocao.png"
    },
    "design_sobrancelha": {
        "keywords": ["design de sobrancelha", "design sobrancelha", "sobrancelha", "design simples", "sobrancelhas"],
        "name": "Design de Sobrancelha",
        "category": "Design & Visagismo",
        "duration": "40min",
        "maintenance": "15 a 20 dias",
        "description": "Mapeamento facial e visagismo personalizado para valorizar os traços únicos do seu rosto. Remoção precisa dos pelos para um desenho limpo, harmônico e natural.",
        "effect": "Alinhamento, Simetria & Expressividade Natural",
        "photo_url": "/modelos/glamour-midnight/assets/img/volume-brasileiro.png"
    },
    "design_sobrancelha_henna": {
        "keywords": ["henna", "sobrancelha com henna", "design com henna", "sobrancelhas com henna", "design de sobrancelha com henna"],
        "name": "Design de Sobrancelha com Henna",
        "category": "Design Facial + Henna",
        "duration": "50min",
        "maintenance": "7 a 15 dias",
        "description": "Design visagista completo combinado com aplicação de henna de alta fixação para preencher falhas, realçar o contorno e destacar o olhar com acabamento impecável.",
        "effect": "Preenchimento de Falhas & Olhar Marcante",
        "photo_url": "/modelos/glamour-midnight/assets/img/volume-brasileiro.png"
    }
}

DEFAULT_PLACEHOLDER_PHOTO = "/modelos/glamour-midnight/assets/img/volume-brasileiro.png"


def api_request(url, method="GET", data=None, headers=None):
    """Executa requisição HTTP usando urllib nativo do Python."""
    req_headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }
    if headers:
        req_headers.update(headers)

    body_bytes = None
    if data is not None:
        if isinstance(data, (dict, list)):
            body_bytes = json.dumps(data, ensure_ascii=False).encode("utf-8")
        elif isinstance(data, bytes):
            body_bytes = data
        else:
            body_bytes = str(data).encode("utf-8")

    req = urllib.request.Request(url, data=body_bytes, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            resp_data = resp.read().decode("utf-8")
            if resp_data:
                try:
                    return json.loads(resp_data)
                except Exception:
                    return resp_data
            return None
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"HTTP {e.code} em {url}: {err_msg}")
    except Exception as e:
        raise RuntimeError(f"Falha de conexão com {url}: {str(e)}")


def upload_cover_image(local_filepath, slug):
    """Faz upload da foto de capa local para o bucket catalog-assets do Supabase."""
    if not os.path.exists(local_filepath):
        print(f"⚠️ Aviso: Arquivo de capa não encontrado em {local_filepath}. Usando capa padrão do modelo.")
        return None

    filename = os.path.basename(local_filepath)
    ext = os.path.splitext(filename)[1].lower() or ".jpg"
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    target_path = f"covers/{slug}_{timestamp}{ext}"

    mime_type, _ = mimetypes.guess_type(local_filepath)
    if not mime_type:
        mime_type = "image/jpeg" if ext in [".jpg", ".jpeg"] else "image/png"

    with open(local_filepath, "rb") as f:
        file_bytes = f.read()

    upload_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{target_path}"
    headers = {
        "Content-Type": mime_type,
        "x-upsert": "true",
        "cache-control": "max-age=31536000"
    }

    try:
        api_request(upload_url, method="POST", data=file_bytes, headers=headers)
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{target_path}"
        print(f"✅ Foto de capa enviada com sucesso para o Supabase Storage: {public_url}")
        return public_url
    except Exception as e:
        print(f"⚠️ Erro ao fazer upload da capa para o Supabase: {e}")
        return None


def upload_service_image(local_filepath, slug, svc_index):
    """Faz upload da foto de serviço local para o bucket catalog-assets do Supabase."""
    if not local_filepath or not os.path.exists(local_filepath):
        print(f"⚠️ Aviso: Arquivo de serviço não encontrado em {local_filepath}.")
        return None

    filename = os.path.basename(local_filepath)
    ext = os.path.splitext(filename)[1].lower() or ".jpg"
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    target_path = f"services/{slug}_svc{svc_index}_{timestamp}{ext}"

    mime_type, _ = mimetypes.guess_type(local_filepath)
    if not mime_type:
        mime_type = "image/jpeg" if ext in [".jpg", ".jpeg"] else "image/png"

    with open(local_filepath, "rb") as f:
        file_bytes = f.read()

    upload_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{target_path}"
    headers = {
        "Content-Type": mime_type,
        "x-upsert": "true",
        "cache-control": "max-age=31536000"
    }

    try:
        api_request(upload_url, method="POST", data=file_bytes, headers=headers)
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{target_path}"
        print(f"✅ Foto de serviço [{svc_index}] enviada com sucesso para o Supabase Storage: {public_url}")
        return public_url
    except Exception as e:
        print(f"⚠️ Erro ao fazer upload da foto de serviço para o Supabase: {e}")
        return None


def ensure_unique_slug(base_name):
    """Gera um slug limpo e único consultando a tabela orders."""
    clean = re.sub(r"[^a-z0-9]", "", base_name.lower().strip()) or "catalogo"
    candidate = clean
    counter = 1

    while counter <= 30:
        url = f"{SUPABASE_URL}/rest/v1/orders?slug=eq.{urllib.parse.quote(candidate)}&select=id"
        res = api_request(url)
        if not res or len(res) == 0:
            return candidate
        counter += 1
        candidate = f"{clean}{counter}"

    return f"{clean}_{int(datetime.now().timestamp()) % 10000}"


def match_canonical_service(raw_service_name):
    """Localiza o serviço canônico oficial a partir do nome ou palavra-chave."""
    raw_lower = raw_service_name.lower().strip()

    # 1. Match exato de nome
    for key, item in CANONICAL_SERVICES.items():
        if item["name"].lower() == raw_lower:
            return item

    # 2. Match de palavra-chave ordenado por especificidade (maior comprimento primeiro)
    candidates = []
    for key, item in CANONICAL_SERVICES.items():
        for kw in item["keywords"]:
            if kw in raw_lower or raw_lower in kw:
                candidates.append((len(kw), item))

    if candidates:
        candidates.sort(key=lambda x: x[0], reverse=True)
        return candidates[0][1]

    return None


def sanitize_price(val):
    """Limpa e padroniza o preço no formato '150,00' ou 'R$ 150,00'."""
    if not val:
        return "Sob Consulta"
    val_str = str(val).replace("R$", "").replace("$", "").strip()
    return val_str


def build_catalog(client_data):
    """
    Função mestre que cria o catálogo no Supabase.
    """
    client_name = client_data.get("client_name", "").strip()
    if not client_name:
        raise ValueError("client_name é obrigatório!")

    # 1. Definir e garantir Slug Único
    base_slug = client_data.get("slug") or client_name
    slug = ensure_unique_slug(base_slug)

    # 2. Upload da Foto de Capa (se houver)
    cover_media_url = client_data.get("cover_media_url")
    local_cover = client_data.get("cover_image_path")
    if local_cover and not cover_media_url:
        cover_media_url = upload_cover_image(local_cover, slug)

    model_id = client_data.get("model_id", "harmonia")
    color_id = client_data.get("color_id", "rose")

    hero_phrase = client_data.get(
        "hero_phrase",
        "Especialista em extensão de cílios. Cada aplicação começa por ouvir você."
    )

    # 3. Payload da Tabela 'orders'
    order_payload = {
        "client_name": client_name,
        "whatsapp": client_data.get("whatsapp", "").strip(),
        "instagram": client_data.get("instagram", "").replace("@", "").strip(),
        "location": client_data.get("location", "").strip(),
        "slug": slug,
        "model_id": model_id,
        "color_id": color_id,
        "hero_phrase": hero_phrase,
        "cover_media_url": cover_media_url,
        "cover_media_type": "image",
        "status": "pendente_revisao",
        "published_url": f"https://{slug}.lashmenu.com",
        "admin_notes": f"Criado via Agente Automatizado LashMenu em {datetime.now().strftime('%d/%m/%Y %H:%M')}"
    }

    insert_order_url = f"{SUPABASE_URL}/rest/v1/orders"
    order_res = api_request(
        insert_order_url,
        method="POST",
        data=order_payload,
        headers={"Prefer": "return=representation"}
    )

    if not order_res or len(order_res) == 0:
        raise RuntimeError("Falha ao criar o pedido na tabela orders.")

    created_order = order_res[0]
    order_id = created_order["id"]
    print(f"✨ Catálogo criado em 'orders' com ID: {order_id} (slug: {slug})")

    # 4. Processar e Inserir os Procedimentos ('order_services')
    raw_services = client_data.get("services", [])
    services_to_insert = []

    for idx, svc in enumerate(raw_services):
        svc_name = svc.get("name", "").strip()
        if not svc_name:
            continue

        # Mapeamento com catálogo oficial
        canonical = match_canonical_service(svc_name)

        final_price = sanitize_price(svc.get("price"))
        final_duration = svc.get("duration") or (canonical["duration"] if canonical else "1h30")
        final_maintenance = svc.get("maintenance") or (canonical["maintenance"] if canonical else "")
        final_category = svc.get("category") or (canonical["category"] if canonical else "Procedimento Especial")
        final_description = svc.get("description") or (canonical["description"] if canonical else f"Aplicação profissional e cuidadosa de {svc_name} com acabamento impecável.")
        final_effect = svc.get("effect") or (canonical["effect"] if canonical else "Realce do Olhar e Definição")

        # Foto oficial, personalizada enviada ou fallback
        final_photo = svc.get("photo_url")
        local_svc_photo = svc.get("photo_path") or svc.get("local_image_path")
        is_custom = False

        if not final_photo and local_svc_photo:
            uploaded_url = upload_service_image(local_svc_photo, slug, idx + 1)
            if uploaded_url:
                final_photo = uploaded_url
                is_custom = True

        if not final_photo:
            if canonical:
                final_photo = canonical["photo_url"]
            else:
                final_photo = DEFAULT_PLACEHOLDER_PHOTO
                is_custom = True

        services_to_insert.append({
            "order_id": order_id,
            "name": canonical["name"] if canonical else svc_name,
            "price": final_price,
            "duration": final_duration,
            "maintenance": final_maintenance,
            "category": final_category,
            "description": final_description,
            "effect": final_effect,
            "photo_url": final_photo,
            "is_custom_photo": is_custom,
            "order_index": idx
        })

    if services_to_insert:
        insert_services_url = f"{SUPABASE_URL}/rest/v1/order_services"
        api_request(
            insert_services_url,
            method="POST",
            data=services_to_insert,
            headers={"Prefer": "return=representation"}
        )
        print(f"💎 {len(services_to_insert)} procedimentos vinculados com sucesso na tabela order_services.")

    # 5. Formatar Resumo e Links Finais
    first_name = client_name.split()[0]
    preview_url = f"https://lashmenu.com/catalogo/?slug={slug}"
    subdomain_url = f"https://{slug}.lashmenu.com"
    admin_editor_url = f"https://lashmenu.com/admin/editor.html?id={order_id}"
    admin_panel_url = "https://lashmenu.com/admin/"

    delivery_message = (
        f"Olá, {first_name}! ✨👑\n\n"
        f"Seu catálogo digital oficial LashMenu está pronto, calibrado e no ar! 🚀\n\n"
        f"🔗 *Seu Link Exclusivo:*\n"
        f"👉 {subdomain_url}\n\n"
        f"📌 *O que fazer agora:*\n"
        f"1. Abra o link no seu celular e confira seu catálogo completo.\n"
        f"2. Coloque este link na bio do seu Instagram e no seu perfil do WhatsApp Business.\n"
        f"3. Comece a enviar para suas clientes no momento do agendamento!\n\n"
        f"Qualquer dúvida ou ajuste que precisar, nossa equipe está à sua inteira disposição. "
        f"Parabéns pelo seu novo posicionamento de luxo! 💖✨"
    )

    result = {
        "success": True,
        "order_id": order_id,
        "slug": slug,
        "client_name": client_name,
        "model": f"{model_id}-{color_id}",
        "services_count": len(services_to_insert),
        "subdomain_url": subdomain_url,
        "preview_url": preview_url,
        "admin_editor_url": admin_editor_url,
        "admin_panel_url": admin_panel_url,
        "delivery_message": delivery_message
    }

    return result


def main():
    if len(sys.argv) < 2:
        print("Uso: python criar_catalogo.py <caminho_json_ou_string_json>")
        sys.exit(1)

    input_arg = sys.argv[1]
    if os.path.exists(input_arg):
        with open(input_arg, "rb") as f:
            data = json.loads(f.read().decode("utf-8", errors="replace"))
    else:
        try:
            data = json.loads(input_arg)
        except Exception as e:
            print(f"Erro ao parsear JSON: {e}")
            sys.exit(1)

    res = build_catalog(data)
    print("\n" + "="*50)
    print("🎉 CATÁLOGO CRIADO COM SUCESSO!")
    print("="*50)
    print(json.dumps(res, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
