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

  function revealCatalog() {
    const foucStyle = document.getElementById('fouc-style');
    if (foucStyle) {
      foucStyle.remove();
    }
    document.documentElement.style.transition = 'opacity 0.25s ease';
    document.documentElement.style.opacity = '1';
    if (document.body) {
      document.body.style.visibility = 'visible';
      document.body.style.opacity = '1';
    }
  }

  const slug = getSlug();
  if (!slug) {
    revealCatalog();
    return; // Se não tem slug, mantém o modelo demonstrativo original
  }

  // Safety Timeout para evitar tela em branco por rede lenta
  const safetyTimer = setTimeout(() => {
    revealCatalog();
  }, 4000);

  const SUPABASE_URL = 'https://wffhptpsafllsmcsoiih.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmZmhwdHBzYWZsbHNtY3NvaWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODkyMTYsImV4cCI6MjEwMjg2NTIxNn0.nwpvIwl8V6_KGIp5e5oeraAcGyt3oo8Kdam2hp6ajSQ';

  try {
    // 1. Busca Pedido no Supabase
    const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?slug=eq.${encodeURIComponent(slug)}&select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!orderRes.ok) return;
    const orders = await orderRes.json();
    if (!orders || orders.length === 0) return;

    const order = orders[0];

    // 2. Busca Procedimentos Ativos
    const servicesRes = await fetch(`${SUPABASE_URL}/rest/v1/order_services?order_id=eq.${order.id}&order_index=gte.0&order=order_index.asc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    const services = servicesRes.ok ? await servicesRes.json() : [];

    // 3. Aplica os Dados no DOM do Modelo Oficial
    applyCustomData(order, services);

  } catch (err) {
    console.warn('Injeção de dados:', err);
  } finally {
    clearTimeout(safetyTimer);
    setTimeout(revealCatalog, 30);
  }

  function applyCustomData(order, services) {
    const designerName = order.client_name || 'Lash Designer';
    const firstName = designerName.split(' ')[0];
    const cleanPhone = (order.whatsapp || '').replace(/\D/g, '');
    const instagram = (order.instagram || '').replace(/^@/, '');
    const location = order.location || '';
    const heroPhrase = order.hero_phrase || '';

    // Título da página
    document.title = `${designerName} — Catálogo Digital Oficial`;

    // 1. Nome na Capa (Hero)
    const heroTitle = document.querySelector('.hero__titulo h1, .hero h1, .capa__titulo h1');
    if (heroTitle) {
      heroTitle.innerHTML = `${designerName}<br><em>Lash Designer</em>`;
    }

    // 2. Frase da Capa
    if (heroPhrase) {
      const heroFraseEl = document.querySelector('.hero__frase, .capa__frase');
      if (heroFraseEl) heroFraseEl.textContent = heroPhrase;
    }

    // 3. Foto / Vídeo da Capa
    if (order.cover_media_url) {
      const heroWrap = document.querySelector('.hero__foto-wrap, .capa__foto-wrap');
      if (heroWrap) {
        if (order.cover_media_type === 'video') {
          heroWrap.innerHTML = `<video class="hero__foto hero__video" src="${order.cover_media_url}" autoplay muted loop playsinline preload="auto"></video>`;
        } else {
          const heroImg = heroWrap.querySelector('img, video');
          if (heroImg) {
            heroImg.src = order.cover_media_url;
            if (heroImg.tagName === 'VIDEO') {
              heroWrap.innerHTML = `<img src="${order.cover_media_url}" alt="${designerName}" class="hero__foto">`;
            }
          }
        }
      }
    }

    // 4. Injeta Procedimentos nos Cards Oficiais e Atualiza Array de Modais
    if (services.length > 0) {
      // Se houver variável global PROCEDIMENTOS no template, atualiza os dados
      if (typeof PROCEDIMENTOS !== 'undefined' && Array.isArray(PROCEDIMENTOS)) {
        PROCEDIMENTOS.length = 0; // Limpa o array padrão
        services.forEach((svc, i) => {
          PROCEDIMENTOS.push({
            id: `proc_${i}`,
            img: svc.photo_url || 'assets/img/hero.jpg',
            alt: svc.name,
            cat: svc.category || 'Extensão de Cílios',
            catLabel: svc.category || 'Extensão de Cílios',
            nome: svc.name,
            title: svc.name,
            preco: svc.price ? `R$ ${svc.price}` : 'Consulte',
            duracao: svc.duration || '1h30',
            desc: svc.description || 'Aplicação minuciosa com fios de alta tecnologia para um acabamento marcante e duradouro.',
            specs: [
              ['Investimento', svc.price ? `R$ ${svc.price}` : 'Consulte'],
              ['Manutenção Pontual', svc.maintenance ? `R$ ${svc.maintenance}` : 'Sob consulta'],
              ['Duração em Cabine', svc.duration || '1h30'],
              ['Efeito', svc.effect || 'Preenchimento e realce do olhar'],
              ['Recomendação', svc.recommendation || 'Manutenção recomendada a cada 15-20 dias']
            ]
          });
        });
      }

      // Se existir a função renderGrid (harmonia templates), re-renderiza o grid com os novos dados
      if (typeof renderGrid === 'function') {
        renderGrid();
      }
      // Se existir a função renderLista (clássico templates), re-renderiza a lista com os novos dados
      else if (typeof renderLista === 'function') {
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

          // Foto do Card
          const cardImg = newCard.querySelector('.card-procedimento__foto, .mosaico__foto, img');
          if (cardImg && svc.photo_url) {
            cardImg.src = svc.photo_url;
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

          // Atribui novo evento de clique para abrir o modal com o ID correto (proc_idx)
          newCard.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof abrirModal === 'function') {
              abrirModal(`proc_${idx}`);
            }
          });

          // Suporte a navegação por teclado
          newCard.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (typeof abrirModal === 'function') {
                abrirModal(`proc_${idx}`);
              }
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
        const label = link.querySelector('span:not(.btn__arrow), p');
        if (label) label.textContent = `@${instagram}`;
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
})();
