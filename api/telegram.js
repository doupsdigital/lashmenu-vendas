export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let data = {};
    if (req.method === 'POST') {
      data = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    } else if (req.query) {
      data = req.query;
    }

    const {
      designerName = 'Lash Designer',
      clientEmail = 'Não informado',
      whatsapp = 'Não informado',
      instagram = 'Não informado',
      selectedModel = 'GLAMOUR',
      selectedColor = 'ROSE',
      slug = 'catalogo',
      orderId = null
    } = data;

    const TELEGRAM_BOT_TOKEN = '8665382415:AAHI93Z9SppDujl-02jyDpPvZ7EEow0zJ8E';
    const TELEGRAM_CHAT_ID = '1874074109';
    const nowStr = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    const adminEditorUrl = orderId 
      ? `https://lashmenu-vendas.vercel.app/admin/editor.html?id=${orderId}`
      : `https://lashmenu-vendas.vercel.app/admin/`;

    const safeModel = (selectedModel || 'glamour').toString().toUpperCase();
    const safeColor = (selectedColor || 'rose').toString().toUpperCase();
    const cleanInsta = instagram ? instagram.toString().replace(/^@/, '').trim() : 'Não informado';

    const tgMessage = `🎉 Nova profissional cadastrada!\n\n` +
      `👤 ${designerName}\n` +
      `✉️ ${clientEmail || 'Não informado'}\n` +
      `📱 ${whatsapp || 'Não informado'}\n` +
      `📸 @${cleanInsta}\n` +
      `🎨 Layout ${safeModel} · ${safeColor}\n` +
      `🔗 https://${slug}.lashmenu.com\n` +
      `🕒 ${nowStr}\n\n` +
      `⚡ Clique para Aprovar no Painel:\n` +
      `${adminEditorUrl}`;

    const tgUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const params = new URLSearchParams();
    params.append('chat_id', TELEGRAM_CHAT_ID);
    params.append('text', tgMessage);

    const tgRes = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const tgJson = await tgRes.json();
    return res.status(200).json({ success: true, telegram: tgJson });
  } catch (error) {
    console.error('Error in /api/telegram:', error);
    return res.status(500).json({ error: error.message });
  }
}
