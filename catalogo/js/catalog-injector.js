/* ==========================================================================
   LASHMENU — INJETOR CIRÚRGICO DE DADOS EM MODELOS OFICIAIS
   ========================================================================== */

(async function initCatalogInjector() {
  function getSlug() {
    const urlParams = new URLSearchParams(window.location.search);
    let s = urlParams.get('slug') || urlParams.get('c') || urlParams.get('p') || urlParams.get('id');
    if (s) return s.toLowerCase().trim();

    const host = window.location.hostname;
    const parts = host.split('.');
    if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'lashmenu-vendas' && !parts[0].includes('localhost') && !parts[0].includes('vercel')) {
      return parts[0].toLowerCase().trim();
    }
    return null;
  }

  function preloadMedia(url) {
    if (!url) return Promise.resolve();
    return new Promise((resolve) => {
      if (url.match(/\.(mp4|webm|mov)(\?.*)?$/i)) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadeddata = resolve;
        video.oncanplay = resolve;
        video.onerror = resolve;
        video.src = url;
        setTimeout(resolve, 1500);
        return;
      }
      const img = new Image();
      img.onload = resolve;
      img.onerror = resolve;
      img.src = url;
      setTimeout(resolve, 1500);
    });
  }

  function revealCatalog() {
    const loader = document.getElementById('lashmenu-loader-overlay');
    const foucStyle = document.getElementById('fouc-style');

    // Garante que as seções iniciem sem .is-visible para que a animação não ocorra escondida atrás do loader
    const heroSections = document.querySelectorAll('.hero, .secao-catalogo, .vitrine, .studio-app, section, header');
    heroSections.forEach(sec => {
      sec.classList.remove('is-visible');
    });

    // Revela com clareza todos os elementos do catalogo
    const appEls = document.querySelectorAll('.mosaico-app, .vitrine, .studio-app, main, section, header, footer');
    appEls.forEach(el => {
      el.style.visibility = 'visible';
      el.style.opacity = '1';
    });

    if (document.body) {
      document.body.style.visibility = 'visible';
      document.body.style.opacity = '1';
      document.body.style.pointerEvents = 'auto';
    }
    document.documentElement.style.opacity = '1';

    // Esmaece a tela de carregamento LashMenu
    if (loader) {
      loader.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.4s ease';
      loader.style.opacity = '0';
      loader.style.pointerEvents = 'none';

      // 200ms após iniciar a saída do loader (quando a tela já está transparente e visível), ativa .is-visible para disparar a animação nativa diante dos olhos do usuário!
      setTimeout(() => {
        heroSections.forEach(sec => {
          void sec.offsetWidth; // Força reflow para reiniciar a transição CSS nativa
          sec.classList.add('is-visible');
        });
      }, 200);

      setTimeout(() => {
        try { loader.remove(); } catch(e){}
        if (foucStyle) {
          try { foucStyle.remove(); } catch(e){}
        }
      }, 400);
    } else {
      heroSections.forEach(sec => sec.classList.add('is-visible'));
      if (foucStyle) {
        try { foucStyle.remove(); } catch(e){}
      }
    }
  }

  const slug = getSlug();
  if (!slug) {
    revealCatalog();
    return; // Se não tem slug, mantém o modelo demonstrativo original
  }

  // 🛡️ BLINDAGEM FRAME 0: Oculta mídias demonstrativas do template imediatamente
  const templateMediaEls = document.querySelectorAll('.hero__foto-wrap img, .hero__foto-wrap video, .capa__foto-wrap img, .capa__foto-wrap video');
  templateMediaEls.forEach(el => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.4s ease';
  });

  // Safety Timeout de emergência para conexões extremamente fracas
  const safetyTimer = setTimeout(() => {
    revealCatalog();
  }, 3500);

  let order = null;
  let services = [];

  // Tenta carregar do cache instantâneo de sessão primeiro
  try {
    const cached = sessionStorage.getItem(`lash_cache_${slug}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.order) {
        order = parsed.order;
        services = parsed.services || [];
      }
    }
  } catch(e){}

  const SUPABASE_URL = 'https://wffhptpsafllsmcsoiih.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmZmhwdHBzYWZsbHNtY3NvaWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODkyMTYsImV4cCI6MjEwMjg2NTIxNn0.nwpvIwl8V6_KGIp5e5oeraAcGyt3oo8Kdam2hp6ajSQ';

  try {
    if (!order) {
      // 1. Busca Pedido no Supabase
      const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?slug=eq.${encodeURIComponent(slug)}&select=*`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });

      if (orderRes.ok) {
        const orders = await orderRes.json();
        if (orders && orders.length > 0) {
          order = orders[0];
          const servicesRes = await fetch(`${SUPABASE_URL}/rest/v1/order_services?order_id=eq.${order.id}&order_index=gte.0&order=order_index.asc`, {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          });
          services = servicesRes.ok ? await servicesRes.json() : [];
          try {
            sessionStorage.setItem(`lash_cache_${slug}`, JSON.stringify({ order, services }));
          } catch(e){}
        }
      }
    }

    if (order) {
      // 2. Aplica os Dados no DOM do Modelo Oficial
      applyCustomData(order, services);

      // 3. 🛡️ PLANO A: Trava prévia da capa/poster antes de retirar a cortina de carregamento
      const mediaToPreload = (order.cover_media_type === 'video' && order.cover_poster_url)
        ? order.cover_poster_url
        : order.cover_media_url;

      if (mediaToPreload) {
        await preloadMedia(mediaToPreload);
      }
    }

  } catch (err) {
    console.warn('Injeção de dados:', err);
  } finally {
    clearTimeout(safetyTimer);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        revealCatalog();
      });
    });
  }

  function applyCustomData(order, services) {
    const designerName = order.client_name || 'Lash Designer';
    const firstName = designerName.split(' ')[0];
    const cleanPhone = (order.whatsapp || '').replace(/\D/g, '');
    const instagram = (order.instagram || '').replace(/^@/, '');
    const location = order.location || '';
    const heroPhrase = order.hero_phrase || '';

    // Salva globalmente para os modais dinâmicos do catálogo
    window.LASHMENU_CLIENT_PHONE = cleanPhone;
    window.LASHMENU_DESIGNER_NAME = designerName;

    // Título da página
    document.title = `${designerName} — Catálogo Digital Oficial`;

    // 1. Nome e Subtítulo/Especialidade na Capa (Hero)
    const designerTitleText = order.lash_title || order.subtitulo || order.hero_subtitle || 'Lash Designer';
    const heroTitle = document.querySelector('.hero__titulo h1, .hero h1, .capa__titulo h1');
    if (heroTitle) {
      heroTitle.innerHTML = `${designerName}<br><em class="hero__subtitulo">${designerTitleText}</em>`;
    }

    // 2. Frase Única da Capa
    const heroFraseEl = document.querySelector('.hero__frase-cilios, .capa__frase-cilios, .hero__frase, .capa__frase');
    if (heroFraseEl) {
      if (heroPhrase && heroPhrase.trim()) {
        heroFraseEl.innerHTML = heroPhrase;
        heroFraseEl.style.display = '';
      } else if (order.hero_phrase === '') {
        heroFraseEl.style.display = 'none';
      }
    }

    // 3. Foto / Vídeo da Capa
    if (order.cover_media_url) {
      const heroWrap = document.querySelector('.hero__foto-wrap, .capa__foto-wrap');
      if (heroWrap) {
        heroWrap.style.willChange = 'transform';
        if (order.cover_media_type === 'video') {
          const posterAttr = order.cover_poster_url ? `poster="${order.cover_poster_url}"` : '';
          heroWrap.innerHTML = `<video class="hero__foto hero__video" src="${order.cover_media_url}" ${posterAttr} autoplay muted loop playsinline preload="metadata" style="opacity: 0; transition: opacity 0.4s ease;"></video>`;
          const vid = heroWrap.querySelector('video');
          if (vid) {
            const revealVid = () => { vid.style.opacity = '1'; };
            vid.onloadeddata = revealVid;
            vid.oncanplay = revealVid;
            vid.onplay = revealVid;
            setTimeout(revealVid, 800);
          }
        } else {
          let heroImg = heroWrap.querySelector('img');
          if (!heroImg) {
            heroWrap.innerHTML = `<img src="${order.cover_media_url}" alt="${designerName}" class="hero__foto" decoding="async" style="opacity: 0; transition: opacity 0.4s ease;">`;
            heroImg = heroWrap.querySelector('img');
          } else {
            heroImg.src = order.cover_media_url;
            heroImg.style.opacity = '0';
            heroImg.style.transition = 'opacity 0.4s ease';
          }
          if (heroImg) {
            const revealImg = () => { heroImg.style.opacity = '1'; };
            heroImg.onload = revealImg;
            if (heroImg.complete) revealImg();
            setTimeout(revealImg, 800);
          }
        }
      }
    }

    // 3.5. Botão Flutuante de WhatsApp (Apenas na Primeira Tela / Hero)
    const wspPhone = cleanPhone || '5562991083435';
    let wspFloatBtn = document.getElementById('wsp-float-btn');
    const heroEl = document.querySelector('.hero, .secao-hero, .capa, .hero__conteudo');

    if (!wspFloatBtn) {
      wspFloatBtn = document.createElement('a');
      wspFloatBtn.id = 'wsp-float-btn';
      wspFloatBtn.className = 'wsp-float-btn';
      wspFloatBtn.target = '_blank';
      wspFloatBtn.rel = 'noopener noreferrer';
      wspFloatBtn.setAttribute('aria-label', 'Falar comigo no WhatsApp');
      wspFloatBtn.innerHTML = `
        <div class="wsp-float-btn__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z" fill="#FFFFFF"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 2.15.68 4.14 1.839 5.776L2.5 21.5l3.876-1.309A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 01-4.298-1.246l-.308-.184-2.296.775.775-2.253-.2-.317A7.957 7.957 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z" fill="#FFFFFF"/>
          </svg>
        </div>
      `;
      if (heroEl) {
        heroEl.style.position = 'relative';
        heroEl.appendChild(wspFloatBtn);
      } else {
        document.body.appendChild(wspFloatBtn);
      }

      if (!document.getElementById('wsp-float-styles')) {
        const style = document.createElement('style');
        style.id = 'wsp-float-styles';
        style.innerHTML = `
          .wsp-float-btn {
            position: absolute;
            bottom: 24px;
            right: 20px;
            z-index: 999;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          .wsp-float-btn:hover {
            transform: translateY(-4px) scale(1.06);
          }
          .wsp-float-btn__icon {
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background: #25D366;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 24px rgba(37, 211, 102, 0.45);
            animation: wspPulse 2.4s infinite ease-in-out;
          }
          @keyframes wspPulse {
            0%, 100% {
              box-shadow: 0 8px 24px rgba(37, 211, 102, 0.45);
            }
            50% {
              box-shadow: 0 12px 32px rgba(37, 211, 102, 0.75), 0 0 0 8px rgba(37, 211, 102, 0.18);
            }
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      if (heroEl && wspFloatBtn.parentElement !== heroEl) {
        heroEl.style.position = 'relative';
        heroEl.appendChild(wspFloatBtn);
      }
    }
    const labelEl = wspFloatBtn.querySelector('.wsp-float-btn__label');
    if (labelEl) labelEl.remove();
    const wspTextMsg = encodeURIComponent(`Olá ${designerName}! Vim pelo seu catálogo digital e gostaria de tirar uma dúvida.`);
    wspFloatBtn.href = `https://wa.me/55${wspPhone}?text=${wspTextMsg}`;

    // 4. Injeta Procedimentos nos Cards Oficiais e Atualiza Array de Modais
    if (services.length > 0) {
      // Tenta localizar a variável de procedimentos no escopo global
      let targetArray = null;
      if (typeof window.PROCEDIMENTOS !== 'undefined' && Array.isArray(window.PROCEDIMENTOS)) {
        targetArray = window.PROCEDIMENTOS;
      } else if (typeof PROCEDIMENTOS !== 'undefined' && Array.isArray(PROCEDIMENTOS)) {
        targetArray = PROCEDIMENTOS;
      }

      if (targetArray) {
        targetArray.length = 0; // Limpa o array padrão
        services.forEach((svc, i) => {
          const rawPrice = svc.price ? svc.price.toString().trim() : '';
          const formattedPrice = rawPrice ? (rawPrice.startsWith('R$') ? rawPrice : `R$ ${rawPrice}`) : 'Consulte';
          const rawMaint = svc.maintenance ? svc.maintenance.toString().trim() : '';
          const formattedMaint = rawMaint ? (rawMaint.startsWith('R$') ? rawMaint : `R$ ${rawMaint}`) : 'Sob consulta';

          // Categorização inteligente do procedimento para os filtros do modelo Harmonia (Apenas Cílios e Sobrancelhas)
          let catSlug = 'volumes';
          const catLower = (svc.category || '').toLowerCase();
          const nameLower = (svc.name || '').toLowerCase();

          if (catLower.includes('sobrancelha') || nameLower.includes('sobrancelha') || nameLower.includes('henna') || nameLower.includes('rena') || nameLower.includes('brow')) {
            catSlug = 'sobrancelhas';
          } else {
            catSlug = 'volumes';
          }

          const specs = [];
          if (formattedPrice && formattedPrice !== 'Consulte') {
            specs.push(['Investimento', formattedPrice]);
          } else if (svc.price && svc.price.toString().trim()) {
            specs.push(['Investimento', formattedPrice]);
          }

          if (svc.maintenance && svc.maintenance.toString().trim()) {
            specs.push(['Manutenção', formattedMaint]);
          }

          if (svc.duration && svc.duration.toString().trim()) {
            specs.push(['Duração', svc.duration.toString().trim()]);
          }

          if (svc.effect && svc.effect.toString().trim()) {
            specs.push(['Efeito', svc.effect.toString().trim()]);
          }

          targetArray.push({
            id: `proc_${i}`,
            img: svc.photo_url || 'assets/img/hero.jpg',
            alt: svc.name,
            cat: catSlug,
            catLabel: (svc.category && svc.category.trim()) ? svc.category.trim() : '',
            nome: svc.name,
            title: svc.name,
            preco: formattedPrice,
            duracao: svc.duration || '1h30',
            desc: svc.description || 'Aplicação minuciosa com fios de alta tecnologia para um acabamento marcante e duradouro.',
            destaque: (typeof svc.destaque !== 'undefined') ? svc.destaque : (i % 5 === 0),
            specs: specs
          });
        });
      }

      // Reconstrói dinamicamente os chips de filtro no modelo Harmonia conforme os procedimentos do cliente
      const filterNav = document.querySelector('.mosaico__filtros');
      if (filterNav && targetArray) {
        const counts = { todos: targetArray.length };
        targetArray.forEach(p => {
          counts[p.cat] = (counts[p.cat] || 0) + 1;
        });

        const labelsMap = {
          todos: 'Todos',
          volumes: 'Extensões & Volumes',
          sobrancelhas: 'Design de Sobrancelhas'
        };

        let navHtml = `<button type="button" class="filtro-chip is-ativo" data-filter="todos">Todos (${counts.todos})</button>`;
        
        ['volumes', 'sobrancelhas'].forEach(catKey => {
          if (counts[catKey] > 0) {
            navHtml += `<button type="button" class="filtro-chip" data-filter="${catKey}">${labelsMap[catKey]} (${counts[catKey]})</button>`;
          }
        });

        filterNav.innerHTML = navHtml;

        // Re-atribui ouvintes de clique nos novos chips de filtro
        const filtroBtns = filterNav.querySelectorAll('.filtro-chip');
        filtroBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            filtroBtns.forEach(b => b.classList.remove('is-ativo'));
            btn.classList.add('is-ativo');
            const filterVal = btn.getAttribute('data-filter');
            window.filtroAtivo = filterVal;
            if (typeof window.renderGrid === 'function') {
              window.renderGrid();
            } else if (typeof renderGrid === 'function') {
              renderGrid();
            }
          });
        });
      }

      // Se existir a função renderGrid (harmonia templates), re-renderiza o grid com os novos dados
      if (typeof window.renderGrid === 'function') {
        window.renderGrid();
      } else if (typeof renderGrid === 'function') {
        renderGrid();
      }
      // Se existir a função renderLista (clássico templates), re-renderiza a lista com os novos dados
      else if (typeof window.renderLista === 'function') {
        window.renderLista();
      } else if (typeof renderLista === 'function') {
        renderLista();
      }
      // Caso contrário (glamour templates), atualiza os cards estáticos no HTML
      else {
        const cards = document.querySelectorAll('.card-procedimento, .mosaico__card, .card-servico');
        cards.forEach((card, idx) => {
          const svc = services[idx];
          if (!svc) {
            card.style.display = 'none';
            return;
          }

          card.style.display = '';

          // Clona o card para remover listeners de clique anteriores (que abriam com os IDs antigos)
          const newCard = card.cloneNode(true);
          card.parentNode.replaceChild(newCard, card);

          newCard.setAttribute('data-proc', `proc_${idx}`);

          // Foto do Card com Lazy Loading
          const cardImg = newCard.querySelector('.card-procedimento__foto, .mosaico__foto, img');
          if (cardImg && svc.photo_url) {
            cardImg.src = svc.photo_url;
            cardImg.setAttribute('loading', 'lazy');
            cardImg.setAttribute('decoding', 'async');
          }

          // Nome
          const cardTitle = newCard.querySelector('.card-procedimento__nome, .mosaico__nome, h3, h4');
          if (cardTitle) {
            cardTitle.textContent = svc.name;
          }

          // Preço
          const cardPrice = newCard.querySelector('.card-procedimento__preco, .mosaico__preco, .preco');
          if (cardPrice && svc.price) {
            cardPrice.textContent = `R$ ${svc.price}`;
          }

          // Meta (Duração / Categoria)
          const cardMeta = newCard.querySelector('.card-procedimento__meta, .mosaico__meta, .duracao');
          if (cardMeta) {
            cardMeta.textContent = `${svc.duration || '1h30'} · ${svc.category || 'fios selecionados'}`;
          }

          // Atribui manipulador universal de clique e toque para abrir o modal com o procedimento correto
          const openProcModal = (e) => {
            if (e && e.cancelable) e.preventDefault();
            if (typeof window.abrirModal === 'function') {
              window.abrirModal(`proc_${idx}`);
            } else if (typeof abrirModal === 'function') {
              abrirModal(`proc_${idx}`);
            }
          };

          newCard.style.cursor = 'pointer';
          newCard.onclick = openProcModal;
          newCard.addEventListener('click', openProcModal);
          newCard.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              openProcModal(e);
            }
          });
        });
      }
    }

    // 5. Links de WhatsApp nos Botões de Agendamento
    if (cleanPhone) {
      const waLinks = document.querySelectorAll('a.btn-whatsapp, a.btn-whatsapp-flutuante, a.contato__btn-whatsapp, a.detalhe-procedimento__cta, a[href*="wa.me"], a[href*="whatsapp.com"]');
      waLinks.forEach(link => {
        const defaultMsg = `Olá, ${firstName}! Estava vendo seu catálogo digital e gostaria de agendar um horário.`;
        link.href = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(defaultMsg)}`;
      });
    }

    // 6. Instagram
    if (instagram) {
      const instaLinks = document.querySelectorAll('a.btn-instagram, a.link-instagram, a[href*="instagram.com"]');
      instaLinks.forEach(link => {
        link.href = `https://instagram.com/${instagram}`;
        const textSpan = link.querySelector('.btn__left span, span > span') || Array.from(link.querySelectorAll('span')).find(s => !s.classList.contains('btn__arrow') && !s.classList.contains('btn__left') && !s.querySelector('svg'));
        if (textSpan) {
          textSpan.textContent = `@${instagram}`;
        } else {
          const fallback = link.querySelector('span:not(.btn__arrow):not(.btn__left), p');
          if (fallback) fallback.textContent = `@${instagram}`;
        }
      });
    }

    // 7. Localização / Endereço no Rodapé
    if (location) {
      const locElements = document.querySelectorAll('.contato__info span, .secao-contato__info span, .rodape__local, .endereco');
      locElements.forEach(el => {
        if (el.textContent.includes('São Paulo') || el.textContent.includes('Rua') || el.classList.contains('endereco')) {
          el.textContent = location;
        }
      });
    }

    // 8. Substituição Recursiva e Completa de Nomes de Placeholders em Textos
    const walkAndReplaceNames = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        let val = node.nodeValue;
        if (val.includes('Amanda Carvalho') || val.includes('Bruna Carvalho') || val.includes('Mariana Alves')) {
          node.nodeValue = val
            .replace(/Amanda Carvalho/g, designerName)
            .replace(/Bruna Carvalho/g, designerName)
            .replace(/Mariana Alves/g, designerName);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE') {
        node.childNodes.forEach(walkAndReplaceNames);
      }
    };
    document.body.childNodes.forEach(walkAndReplaceNames);

    // 9. Atualização de Alt Tags e Meta Tags de SEO
    document.querySelectorAll('img').forEach(img => {
      const alt = img.getAttribute('alt');
      if (alt && (alt.includes('Amanda Carvalho') || alt.includes('Bruna Carvalho') || alt.includes('Mariana Alves'))) {
        img.setAttribute('alt', alt
          .replace(/Amanda Carvalho/g, designerName)
          .replace(/Bruna Carvalho/g, designerName)
          .replace(/Mariana Alves/g, designerName)
        );
      }
    });

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      const content = metaDesc.getAttribute('content');
      if (content && (content.includes('Amanda Carvalho') || content.includes('Bruna Carvalho') || content.includes('Mariana Alves'))) {
        metaDesc.setAttribute('content', content
          .replace(/Amanda Carvalho/g, designerName)
          .replace(/Bruna Carvalho/g, designerName)
          .replace(/Mariana Alves/g, designerName)
        );
      }
    }
  }

  // Interceptador global de cliques para garantir número do WhatsApp cadastrado e mensagem por procedimento
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a.btn-whatsapp, a.btn-whatsapp-flutuante, a.contato__btn-whatsapp, a.detalhe-procedimento__cta, a.modal__cta, a[href*="wa.me"], a[href*="whatsapp.com"], a[href*="api.whatsapp.com"]');
    if (!link) return;

    const phone = (typeof window !== 'undefined' && window.LASHMENU_CLIENT_PHONE) ? window.LASHMENU_CLIENT_PHONE : null;
    if (!phone) return;

    const designerName = (typeof window !== 'undefined' && window.LASHMENU_DESIGNER_NAME) ? window.LASHMENU_DESIGNER_NAME : 'Lash Designer';
    const firstName = designerName.split(' ')[0];

    let procName = '';
    const modalContainer = link.closest('.detalhe-procedimento, [data-detalhe], #modal-procedimento, .modal, .modal__corpo, .detalhe-procedimento__corpo');
    if (modalContainer) {
      const titleEl = modalContainer.querySelector('.detalhe-procedimento__titulo, .modal__titulo, .detalhe-procedimento__nome, h2, h3');
      if (titleEl) {
        procName = titleEl.textContent.trim();
      }
    }

    if (!procName) {
      const btnText = link.textContent.trim();
      if (btnText.startsWith('Agendar ') && !btnText.includes('Agendar no WhatsApp')) {
        procName = btnText.replace(/^Agendar\s+/, '').replace(/\s*→$/, '').trim();
      }
    }

    const message = procName
      ? `Olá, ${firstName}! Estava vendo seu catálogo digital e gostaria de agendar o procedimento: *${procName}*.`
      : `Olá, ${firstName}! Estava vendo seu catálogo digital e gostaria de agendar um horário.`;

    link.href = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
  }, true);
})();
