/* ==========================================================================
   LASHMENU — MOTOR DINÂMICO MULTI-TENANT DE RENDERIZAÇÃO DE CATÁLOGOS
   ========================================================================== */

(async function initDynamicCatalog() {
  const loader = document.getElementById('catalog-loader');
  const errorScreen = document.getElementById('catalog-error');
  const app = document.getElementById('catalog-app');
  const themeStylesheet = document.getElementById('theme-stylesheet');

  // 1. Extração do Subdomínio / Slug
  function getSlug() {
    const urlParams = new URLSearchParams(window.location.search);
    const querySlug = urlParams.get('slug') || urlParams.get('c') || urlParams.get('p');
    if (querySlug) return querySlug.toLowerCase().trim();

    // Tenta obter do Path (ex: /catalogo/marialuiza ou /c/marialuiza)
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 2 && (pathParts[0] === 'catalogo' || pathParts[0] === 'c')) {
      return pathParts[1].toLowerCase().trim();
    }

    // Tenta obter do Subdomínio (ex: marialuiza.lashmenu.com)
    const hostname = window.location.hostname;
    const hostParts = hostname.split('.');
    if (hostParts.length >= 3 && hostParts[0] !== 'www' && hostParts[0] !== 'lashmenu-vendas') {
      return hostParts[0].toLowerCase().trim();
    }

    return null;
  }

  const slug = getSlug();

  if (!slug) {
    if (loader) loader.classList.add('is-hidden');
    if (errorScreen) errorScreen.classList.add('is-active');
    return;
  }

  // Redireciona modelos estáticos oficiais diretamente para /modelos/:slug/index.html
  const staticModels = [
    'harmonia-rose', 'harmonia-midnight',
    'classico-rose', 'classico-midnight',
    'glamour-rose', 'glamour-midnight'
  ];

  if (staticModels.includes(slug)) {
    window.location.replace(`/modelos/${slug}/index.html`);
    return;
  }

  // 2. Busca os Dados no Supabase

  try {
    const SUPABASE_URL = 'https://wffhptpsafllsmcsoiih.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmZmhwdHBzYWZsbHNtY3NvaWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODkyMTYsImV4cCI6MjEwMjg2NTIxNn0.nwpvIwl8V6_KGIp5e5oeraAcGyt3oo8Kdam2hp6ajSQ';

    const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?slug=eq.${encodeURIComponent(slug)}&select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!orderRes.ok) throw new Error('Falha ao buscar pedido');
    const orders = await orderRes.json();

    if (!orders || orders.length === 0) {
      if (loader) loader.classList.add('is-hidden');
      if (errorScreen) errorScreen.classList.add('is-active');
      return;
    }

    const order = orders[0];

    // Busca os Procedimentos Vinculados
    const servicesRes = await fetch(`${SUPABASE_URL}/rest/v1/order_services?order_id=eq.${order.id}&order=order_index.asc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    const services = servicesRes.ok ? await servicesRes.json() : [];

    // 3. Aplica o Tema Escolhido (Modelo + Paleta)
    const model = order.model_id || 'glamour';
    const color = order.color_id || 'midnight';
    const themePath = `../${model}-${color}/css/style.css?v=2026`;
    if (themeStylesheet) {
      themeStylesheet.href = themePath;
    }

    document.title = `${order.client_name} — Catálogo Digital Oficial`;

    // 4. Renderiza o Template
    renderCatalog(order, services, model, color);

    // Oculta loader
    if (loader) {
      setTimeout(() => loader.classList.add('is-hidden'), 200);
    }
  } catch (err) {
    console.error('Erro na renderização do catálogo:', err);
    if (loader) loader.classList.add('is-hidden');
    if (errorScreen) errorScreen.classList.add('is-active');
  }

  // 5. Função de Renderização do Modelo
  function renderCatalog(order, services, model, color) {
    const designerName = order.client_name || 'Lash Designer';
    const cleanPhone = (order.whatsapp || '').replace(/\D/g, '');
    const instagram = (order.instagram || '').replace(/^@/, '');
    const location = order.location || 'Atendimento com horário marcado';
    const heroPhrase = order.hero_phrase || 'Especialista em extensão de cílios. Cada aplicação começa por ouvir você.';
    
    // Mídia de Capa (Foto ou Vídeo)
    const isVideo = order.cover_media_type === 'video' && order.cover_media_url;
    const coverMediaHtml = isVideo
      ? `<video class="hero__foto hero__video" src="${order.cover_media_url}" autoplay muted loop playsinline preload="auto"></video>`
      : `<img src="${order.cover_media_url || `../${model}-${color}/assets/img/Hero.png`}" alt="${designerName}" class="hero__foto" onerror="this.src='../glamour-midnight/assets/img/hero.jpg'">`;

    // Renderiza os Cards de Procedimentos
    const servicesCardsHtml = services.map((svc, idx) => {
      const priceText = svc.price ? `R$ ${svc.price}` : 'Sob Consulta';
      const durationText = svc.duration ? `${svc.duration}` : '1h30';
      const categoryText = svc.category || 'fios selecionados';
      const photoUrl = svc.photo_url || `../glamour-midnight/assets/img/hero.jpg`;

      return `
        <article class="card-procedimento" data-idx="${idx}" tabindex="0" role="button" aria-label="Ver detalhes de ${svc.name}">
          <div class="card-procedimento__foto-box">
            <img src="${photoUrl}" alt="${svc.name}" class="card-procedimento__foto" loading="lazy" onerror="this.src='../glamour-midnight/assets/img/hero.jpg'">
            <h3 class="card-procedimento__nome">${svc.name}</h3>
          </div>
          <div class="card-procedimento__info">
            <span class="card-procedimento__preco">${priceText}</span>
            <p class="card-procedimento__meta">${durationText} · ${categoryText}</p>
          </div>
        </article>
      `;
    }).join('');

    // Estrutura Completa de 4 Seções (Hero -> Procedimentos -> Orientações -> Contato)
    app.innerHTML = `
      <div class="vitrine" id="vitrine-scroll">
        
        <!-- SEÇÃO 1: HERO CAPA -->
        <section class="hero" id="screen-hero" data-screen-label="Hero">
          <div class="hero__foto-wrap">
            ${coverMediaHtml}
          </div>
          <div class="hero__scrim"></div>
          <div class="hero__conteudo">
            <div class="hero__selo">
              <span>Seja Bem Vinda</span>
            </div>
            <div class="hero__titulo">
              <h1>${designerName}<br><em>Lash Designer</em></h1>
              <div class="hero__filete"></div>
              <p class="hero__frase">${heroPhrase}</p>
              <p class="hero__frase-cilios">Cílios pensados para o <em>seu olhar</em> — técnica segura, desenho personalizado.</p>
            </div>
            <a href="#screen-procedimentos" class="hero__scroll-cue" style="text-decoration: none; color: inherit;">
              <span>Deslize</span>
              <div class="hero__scroll-linha"></div>
            </a>
          </div>
        </section>

        <!-- SEÇÃO 2: PROCEDIMENTOS -->
        <section class="procedimentos" id="screen-procedimentos" data-screen-label="Procedimentos">
          <div class="procedimentos__foto-wrap">
            <img src="${order.cover_media_url || `../${model}-${color}/assets/img/Hero.png`}" alt="${designerName}" class="procedimentos__foto" onerror="this.src='../glamour-midnight/assets/img/hero.jpg'">
          </div>
          <div class="procedimentos__scrim"></div>
          <div class="procedimentos__conteudo">
            <span class="etiqueta">Catálogo</span>
            <div class="procedimentos__corpo">
              <p class="procedimentos__frase">Procedimentos</p>
              <p class="procedimentos__dica">(Toque nos cards para ver detalhes e agendar)</p>
              <div class="procedimentos__lista">
                ${servicesCardsHtml}
              </div>
            </div>
            <a href="#screen-orientacoes" class="hero__scroll-cue" style="text-decoration: none; color: inherit; margin-top: 10px;">
              <span>Deslize</span>
              <div class="hero__scroll-linha"></div>
            </a>
          </div>
        </section>

        <!-- SEÇÃO 3: ORIENTAÇÕES / ANTES DE VIR -->
        <section class="agendamento" id="screen-orientacoes" data-screen-label="Orientações">
          <div class="agendamento__foto-wrap">
            <img src="${order.cover_media_url || `../${model}-${color}/assets/img/Hero.png`}" alt="Orientações" class="agendamento__foto" onerror="this.src='../glamour-midnight/assets/img/hero.jpg'">
          </div>
          <div class="agendamento__scrim"></div>
          <div class="agendamento__conteudo">
            <span class="etiqueta">Antes de vir</span>
            <div class="agendamento__corpo">
              <h2 class="agendamento__frase">Orientações para o <em>seu dia</em>.</h2>
              <div class="agendamento__lista">
                <div class="agendamento__item">
                  <span class="agendamento__numeral">01</span>
                  <div class="agendamento__texto">
                    <strong>Confirmação</strong>
                    <p>Até um dia antes do seu horário marcado.</p>
                  </div>
                </div>
                <div class="agendamento__item">
                  <span class="agendamento__numeral">02</span>
                  <div class="agendamento__texto">
                    <strong>Pontualidade</strong>
                    <p>Tolerância máxima de 15 minutos de atraso.</p>
                  </div>
                </div>
                <div class="agendamento__item">
                  <span class="agendamento__numeral">03</span>
                  <div class="agendamento__texto">
                    <strong>Preparação</strong>
                    <p>Venha com a região dos olhos limpa e sem maquiagem.</p>
                  </div>
                </div>
                <div class="agendamento__item agendamento__item--ultimo">
                  <span class="agendamento__numeral">04</span>
                  <div class="agendamento__texto">
                    <strong>Manutenção</strong>
                    <p>Recomendada entre 15 a 20 dias para fios impecáveis.</p>
                  </div>
                </div>
              </div>
            </div>
            <a href="#screen-contato" class="hero__scroll-cue" style="text-decoration: none; color: inherit;">
              <span>Deslize</span>
              <div class="hero__scroll-linha"></div>
            </a>
          </div>
        </section>

        <!-- SEÇÃO 4: CONTATO & AGENDAMENTO -->
        <section class="contato" id="screen-contato" data-screen-label="Contato">
          <div class="contato__foto-wrap">
            <img src="${order.cover_media_url || `../${model}-${color}/assets/img/Hero.png`}" alt="Contato" class="contato__foto" onerror="this.src='../glamour-midnight/assets/img/hero.jpg'">
          </div>
          <div class="contato__scrim"></div>
          <div class="contato__conteudo">
            <p class="contato__titulo"><em>Vamos</em><br>desenhar<br>seu olhar.</p>
            <div class="contato__acoes">
              <a class="btn-whatsapp" href="https://api.whatsapp.com/send?phone=${cleanPhone}&text=Ol%C3%A1%2C%20${encodeURIComponent(designerName)}!%20Estava%20olhando%20seu%20cat%C3%A1logo%20e%20gostaria%20de%20agendar%20um%20hor%C3%A1rio." target="_blank" rel="noopener">
                <span class="btn__left">
                  <svg class="btn__icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.43 0-2.82-.37-4.05-1.08l-.29-.17-3.12.82.83-3.04-.19-.3a8.132 8.132 0 0 1-1.25-4.46c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.58c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.22-.16-.47-.28z"/></svg>
                  <span>Agendar no WhatsApp</span>
                </span>
                <span class="btn__arrow">→</span>
              </a>
              ${instagram ? `
                <a class="btn-instagram" href="https://instagram.com/${instagram}" target="_blank" rel="noopener">
                  <span class="btn__left">
                    <svg class="btn__icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    <span>@${instagram}</span>
                  </span>
                  <span class="btn__arrow">→</span>
                </a>
              ` : ''}
            </div>
            <div class="contato__info">
              <span>Dinheiro · Pix · Débito · Crédito</span>
              ${location ? `<span>📍 ${location}</span>` : ''}
            </div>
          </div>
        </section>

      </div>

      <!-- MODAL DE DETALHES DO PROCEDIMENTO (BOTTOM SHEET LUXO) -->
      <div class="detalhe-procedimento" id="modal-procedimento" hidden>
        <div class="detalhe-procedimento__backdrop" id="modal-backdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100;"></div>
        <div class="detalhe-procedimento__sheet" id="modal-sheet" style="position: fixed; bottom: 0; left: 0; right: 0; max-height: 85vh; overflow-y: auto; z-index: 101;">
          <!-- Injetado dinamicamente no clique -->
        </div>
      </div>
    `;

    // 6. Interatividade dos Modais de Procedimento
    initProcedureModalEvents(services, designerName, cleanPhone);
  }

  function initProcedureModalEvents(services, designerName, cleanPhone) {
    const modalWrapper = document.getElementById('modal-procedimento');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalSheet = document.getElementById('modal-sheet');

    const closeModal = () => {
      if (modalWrapper) {
        modalWrapper.hidden = true;
      }
    };

    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

    document.querySelectorAll('.card-procedimento').forEach((card) => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.getAttribute('data-idx'), 10);
        const svc = services[idx];
        if (!svc || !modalSheet) return;

        const photoUrl = svc.photo_url || '../glamour-midnight/assets/img/hero.jpg';
        const price = svc.price ? `R$ ${svc.price}` : 'Consulte';
        const duration = svc.duration || '1h30';
        const maintenance = svc.maintenance ? `R$ ${svc.maintenance}` : 'Sob consulta';
        const category = svc.category || 'Extensão de Cílios';
        const description = svc.description || 'Aplicação minuciosa com fios de alta tecnologia para um acabamento marcante e duradouro.';
        const effect = svc.effect || 'Preenchimento, volume e realce do olhar';

        const whatsappMsg = `Olá, ${designerName.split(' ')[0]}! Estava vendo seu catálogo digital e quero agendar: *${svc.name}* (${price}).`;
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(whatsappMsg)}`;

        modalSheet.innerHTML = `
          <div class="detalhe-procedimento__foto-box" style="position: relative; height: 260px; overflow: hidden;">
            <img src="${photoUrl}" alt="${svc.name}" style="width: 100%; height: 100%; object-fit: cover;">
            <button type="button" class="detalhe-procedimento__fechar" id="btn-close-sheet" style="position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; border-radius: 50%; background: rgba(0,0,0,0.6); color: #fff; border: none; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">✕</button>
          </div>
          <div class="detalhe-procedimento__conteudo" style="padding: 24px;">
            <span class="detalhe-procedimento__etiqueta">${category}</span>
            <h2 class="detalhe-procedimento__nome" style="font-size: 1.6rem; margin: 6px 0 16px 0;">${svc.name}</h2>
            
            <div class="detalhe-procedimento__grid-valores" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px;">
              <div>
                <span style="font-size: 0.72rem; color: #a3958c; text-transform: uppercase; display: block;">Aplicação</span>
                <strong style="font-size: 1.1rem; color: #fff;">${price}</strong>
              </div>
              <div>
                <span style="font-size: 0.72rem; color: #a3958c; text-transform: uppercase; display: block;">Duração</span>
                <strong style="font-size: 1.1rem; color: #fff;">${duration}</strong>
              </div>
              <div>
                <span style="font-size: 0.72rem; color: #a3958c; text-transform: uppercase; display: block;">Manutenção</span>
                <strong style="font-size: 1.1rem; color: #fff;">${maintenance}</strong>
              </div>
            </div>

            <div style="margin-bottom: 24px; line-height: 1.6; color: #d4c7bd; font-size: 0.92rem;">
              <p style="margin-bottom: 12px;"><strong>Sobre:</strong> ${description}</p>
              <p><strong>Efeito:</strong> ${effect}</p>
            </div>

            <a href="${whatsappUrl}" target="_blank" rel="noopener" class="btn-whatsapp" style="display: flex; align-items: center; justify-content: center; width: 100%; padding: 14px; background: #25d366; color: #fff; border-radius: 100px; text-decoration: none; font-weight: 700; font-size: 0.95rem; gap: 8px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.43 0-2.82-.37-4.05-1.08l-.29-.17-3.12.82.83-3.04-.19-.3a8.132 8.132 0 0 1-1.25-4.46c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.58c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.22-.16-.47-.28z"/></svg>
              <span>Agendar este Procedimento</span>
            </a>
          </div>
        `;

        document.getElementById('btn-close-sheet')?.addEventListener('click', closeModal);

        if (modalWrapper) {
          modalWrapper.hidden = false;
        }
      });
    });
  }
})();
