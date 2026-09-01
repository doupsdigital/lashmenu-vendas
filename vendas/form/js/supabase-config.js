/* ==========================================================================
   SUPABASE CLIENT & REST API ENGINE — LASHMENU
   ========================================================================== */

const SUPABASE_URL = 'https://qmaugeipttwvxnfkzsed.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtYXVnZWlwdHR3dnhuZmt6c2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzczMzgsImV4cCI6MjEwMzg1MzMzOH0.6P2veiuqjaxBOj6eMZ7BDO7wqdUVTMWxOKC76R1AHLA';

// Inicializa cliente SDK oficial se disponível
let _supabaseSdk = null;
if (window.supabase && typeof window.supabase.createClient === 'function') {
  try {
    _supabaseSdk = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.warn('SDK Init fallback:', e);
  }
}

// Engine Universal (SDK + Direct REST Fetch Fallback)
window.lashSupabase = {
  // 1. Upload de Arquivo no Storage
  async uploadFile(bucket, path, file) {
    if (!file) return null;

    // Tenta via SDK primeiro
    if (_supabaseSdk && _supabaseSdk.storage) {
      try {
        const { data, error } = await _supabaseSdk.storage.from(bucket).upload(path, file, {
          upsert: true,
          cacheControl: '31536000'
        });
        if (!error) {
          const { data: pubData } = _supabaseSdk.storage.from(bucket).getPublicUrl(path);
          return pubData.publicUrl;
        }
      } catch (err) {
        console.warn('Storage SDK falhou, usando Fetch API:', err);
      }
    }

    // Fallback direto via Fetch API
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': file.type || 'application/octet-stream',
        'cache-control': 'max-age=31536000',
        'x-upsert': 'true'
      },
      body: file
    });

    if (res.ok) {
      return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
    } else {
      const errTxt = await res.text();
      throw new Error(`Erro no upload (${res.status}): ${errTxt}`);
    }
  },

  // 2. Garante que o Subdomínio seja Único
  async ensureUniqueSlug(baseSlug) {
    let clean = (baseSlug || 'catalogo').toLowerCase().replace(/[^a-z0-9]/g, '') || 'catalogo';
    let candidate = clean;
    let counter = 1;

    while (counter <= 50) {
      const checkUrl = `${SUPABASE_URL}/rest/v1/orders?slug=eq.${encodeURIComponent(candidate)}&select=id`;
      try {
        const res = await fetch(checkUrl, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        if (res.ok) {
          const rows = await res.json();
          if (!rows || rows.length === 0) {
            return candidate; // Disponível!
          }
        } else {
          return candidate;
        }
      } catch (e) {
        return candidate;
      }
      counter++;
      candidate = `${clean}${counter}`;
    }
    return `${clean}-${Date.now().toString().slice(-4)}`;
  },

  // 3. Inserir Registro em Tabela
  async insert(table, records) {
    const isArray = Array.isArray(records);
    const payload = isArray ? records : [records];

    // Tenta via SDK primeiro
    if (_supabaseSdk && _supabaseSdk.from) {
      try {
        const { data, error } = await _supabaseSdk.from(table).insert(payload).select();
        if (!error && data) {
          return isArray ? data : data[0];
        }
      } catch (err) {
        console.warn(`Insert SDK falhou na tabela ${table}, usando Fetch API:`, err);
      }
    }

    // Fallback direto via Fetch REST API
    const restUrl = `${SUPABASE_URL}/rest/v1/${table}`;
    const res = await fetch(restUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      return isArray ? data : data[0];
    } else {
      const errTxt = await res.text();
      throw new Error(`Erro ao inserir em ${table} (${res.status}): ${errTxt}`);
    }
  }
};
