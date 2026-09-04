/* ==========================================================================
   LASHMENU — MODELO MOSAICO ROSE (JS COM GRID, ANIMAÇÕES E MODAL)
   ========================================================================== */

var PROCEDIMENTOS = [
  // --- 1. EXTENSÃO DE CÍLIOS & VOLUMES ---
  {
    id: 'brasileiro',
    cat: 'cilios',
    catLabel: 'Extensão em Y',
    title: 'Volume Brasileiro',
    preco: 'R$ 150',
    duracao: '1h30',
    img: 'assets/img/volume-brasileiro.png',
    destaque: true,
    desc: 'Fios tecnológicos com formato Y que preenchem as falhas naturais com leveza incomparável, alta durabilidade e acabamento marcante.',
    specs: [
      ['Investimento', 'R$ 150'],
      ['Duração', '1h30'],
      ['Manutenção', 'R$ 90 (até 20 dias)']
    ]
  },
  {
    id: 'classico',
    cat: 'cilios',
    catLabel: 'Fio a Fio Clássico',
    title: 'Clássico Fio a Fio',
    preco: 'R$ 120',
    duracao: '1h30',
    img: 'assets/img/classico-fio-a-fio.png',
    desc: 'Um fio sintético ultrafino acoplado a cada cílio natural saudável. O resultado mais elegante e discreto: olhar iluminado com efeito de rímel perfeito.',
    specs: [
      ['Investimento', 'R$ 120'],
      ['Duração', '1h30'],
      ['Manutenção', 'R$ 70 (até 18 dias)']
    ]
  },
  {
    id: 'egipcio',
    cat: 'cilios',
    catLabel: 'Extensão em W',
    title: 'Volume Egípcio',
    preco: 'R$ 160',
    duracao: '1h30',
    img: 'assets/img/volume-egipcio.png',
    desc: 'Fios especiais em formato W (3D tecnológico) que proporcionam densidade homogênea, efeito aveludado e volume equilibrado sem pesar nos olhos.',
    specs: [
      ['Investimento', 'R$ 160'],
      ['Duração', '1h30'],
      ['Manutenção', 'R$ 95 (até 20 dias)']
    ]
  },
  {
    id: 'hibrido',
    cat: 'cilios',
    catLabel: 'Clássico + Volume',
    title: 'Volume Híbrido',
    preco: 'R$ 160',
    duracao: '1h45',
    img: 'assets/img/volume-hibrido.png',
    desc: 'A combinação artesanal entre a delicadeza do fio a fio clássico e leques de volume, criando textura multidimensional, profundidade e brilho no olhar.',
    specs: [
      ['Investimento', 'R$ 160'],
      ['Duração', '1h45'],
      ['Manutenção', 'R$ 95 (até 20 dias)']
    ]
  },
  {
    id: 'russo',
    cat: 'cilios',
    catLabel: 'Fans Artesanais 3D–6D',
    title: 'Volume Russo',
    preco: 'R$ 190',
    duracao: '2h00',
    img: 'assets/img/volume-russo.png',
    desc: 'Técnica de alta precisão com fans ultrafinos (3 a 6 fios de seda) montados à mão na hora. Cria um volume expressivo, extremamente macio, denso e sofisticado.',
    specs: [
      ['Investimento', 'R$ 190'],
      ['Duração', '2h00'],
      ['Manutenção', 'R$ 110 (até 20 dias)']
    ]
  },
  {
    id: 'mega',
    cat: 'cilios',
    catLabel: 'Densidade Máxima 8D–12D',
    title: 'Mega Volume',
    preco: 'R$ 240',
    duracao: '2h30',
    img: 'assets/img/mega-volume.png',
    destaque: true,
    desc: 'O ápice da densidade e do impacto visual: leques artesanais com fios ultrafinos de 0.03mm. Proporciona um olhar super pretinho, aveludado e hipnotizante.',
    specs: [
      ['Investimento', 'R$ 240'],
      ['Duração', '2h30'],
      ['Manutenção', 'R$ 140 (até 18 dias)']
    ]
  },

  // --- 2. MAPPINGS DE OLHAR (INCORPORADOS EM EXTENSÃO DE CÍLIOS) ---
  {
    id: 'gatinho',
    cat: 'cilios',
    catLabel: 'Mapping de Olhar',
    title: 'Mapping Gatinho',
    preco: 'Incluso',
    duracao: 'Design',
    img: 'assets/img/mapping-gatinho.png',
    desc: 'Crescimento milimétrico dos fios em direção ao canto externo. Alonga o olhar, cria um efeito felino refinado e valoriza o contorno dos olhos.',
    specs: [
      ['Investimento', 'Incluso na técnica escolhida'],
      ['Duração', 'Design'],
      ['Estilo de Design', 'Alongado / Felino'],
      ['Indicação', 'Olhos amendoados, redondos ou juntos'],
      ['Combinações', 'Brasileiro, Russo, Híbrido e Clássico']
    ]
  },
  {
    id: 'boneca',
    cat: 'cilios',
    catLabel: 'Mapping de Olhar',
    title: 'Mapping Boneca',
    preco: 'Incluso',
    duracao: 'Design',
    img: 'assets/img/mapping-boneca.png',
    desc: 'Fios com maior comprimento posicionados estrategicamente no centro da íris. Abre e ilumina o olhar, proporcionando aspecto doce, expressivo e jovial.',
    specs: [
      ['Investimento', 'Incluso na técnica escolhida'],
      ['Duração', 'Design'],
      ['Estilo de Design', 'Olhar Aberto / Centralizado'],
      ['Indicação', 'Olhos caídos, fundos ou orientais'],
      ['Combinações', 'Clássico, Brasileiro e Egípcio']
    ]
  },
  {
    id: 'esquilo',
    cat: 'cilios',
    catLabel: 'Mapping de Olhar',
    title: 'Mapping Esquilo',
    preco: 'Incluso',
    duracao: 'Design',
    img: 'assets/img/mapping-esquilo.png',
    desc: 'Pico de comprimento posicionado exatamente no arco da sobrancelha (ponto alto). Disfarça pálpebra caída e cria um efeito de lifting imediato.',
    specs: [
      ['Investimento', 'Incluso na técnica escolhida'],
      ['Duração', 'Design'],
      ['Estilo de Design', 'Efeito Lifting da Pálpebra'],
      ['Indicação', 'Pálpebras gordinhas, caídas ou maduras'],
      ['Combinações', 'Híbrido, Russo e Egípcio']
    ]
  },
  {
    id: 'fox',
    cat: 'cilios',
    catLabel: 'Design Assinatura',
    title: 'Fox Eyes Signature',
    preco: 'R$ 170',
    duracao: '1h45',
    img: 'assets/img/fox-eyes.png',
    desc: 'O desenho de maior sucesso do estúdio: extremidade externa esticada e alinhada com mapping milimétrico para um visual sensual, moderno e marcante.',
    specs: [
      ['Investimento', 'R$ 170'],
      ['Duração', '1h45'],
      ['Manutenção', 'R$ 100 (até 20 dias)']
    ]
  },

  // --- 3. SOBRANCELHAS ---
  {
    id: 'design-sobrancelha',
    cat: 'sobrancelhas',
    catLabel: 'Visagismo Facial',
    title: 'Design de Sobrancelha',
    preco: 'R$ 60',
    duracao: '45min',
    img: 'assets/img/design-sobrancelha.jpg',
    destaque: true,
    desc: 'Mapeamento facial minucioso baseado nas proporções únicas do seu rosto, seguido de epilação precisa para realçar sua beleza natural com simetria e elegância.',
    specs: [
      ['Investimento', 'R$ 60'],
      ['Duração', '45 minutos'],
      ['Manutenção', 'Recomendado a cada 15 a 20 dias'],
      ['Técnica', 'Visagismo Facial & Design com Pinça']
    ]
  },
  {
    id: 'sobrancelha-henna',
    cat: 'sobrancelhas',
    catLabel: 'Pigmentação Natural',
    title: 'Sobrancelha com Henna',
    preco: 'R$ 80',
    duracao: '50min',
    img: 'assets/img/sobrancelha-henna.jpg',
    desc: 'Design personalizado acompanhado de aplicação de Henna orgânica de altíssima fixação. Preenche falhas, define o contorno com efeito ombré natural e destaca o olhar.',
    specs: [
      ['Investimento', 'R$ 80'],
      ['Duração', '50 minutos'],
      ['Durabilidade', '7 a 14 dias na pele (até 30 dias nos fios)']
    ]
  },

  // --- 4. ESPECIAIS & CUIDADOS ---
  {
    id: 'lifting',
    cat: 'especiais',
    catLabel: 'Cílios Naturais',
    title: 'Lash Lifting & Nutrição',
    preco: 'R$ 130',
    duracao: '1h00',
    img: 'assets/img/lash-lifting.png',
    desc: 'Tratamento de curvatura, nutrição profunda com queratina e tintura preta nos seus próprios cílios naturais. Zero manutenção e durabilidade de 6 a 8 semanas.',
    specs: [
      ['Investimento', 'R$ 130'],
      ['Duração', '1h00'],
      ['Durabilidade do Efeito', '6 a 8 semanas (acompanha o ciclo natural)'],
      ['Manutenção Diária', 'Zero manutenção — livre para usar rímel']
    ]
  },
  {
    id: 'remocao',
    cat: 'especiais',
    catLabel: 'Segurança & Saúde',
    title: 'Remoção Segura',
    preco: 'R$ 50',
    duracao: '30min',
    img: 'assets/img/remocao.png',
    desc: 'Remoção química indolor realizada com gel removedor profissional específico que dissolve o adesivo sem tracionar ou danificar nenhum fio natural.',
    specs: [
      ['Investimento', 'R$ 50'],
      ['Duração', '30 minutos'],
      ['Segurança', 'Preservação de 100% da integridade dos fios naturais'],
      ['Indicação', 'Remoção de extensões anteriores ou pausa']
    ]
  },
  {
    id: 'cuidados',
    cat: 'especiais',
    catLabel: 'Guia de Durabilidade',
    title: 'Cuidados Pós-Aplicação',
    preco: 'Guia',
    duracao: 'Diário',
    img: 'assets/img/cuidados.jpg',
    desc: 'Orientações práticas para prolongar a retenção dos seus cílios: evitar água nas primeiras 24h, higienizar com shampoo neutro e escovar diariamente.',
    specs: [
      ['Primeiras 24 Horas', 'Não molhar e evitar vapor/sauna'],
      ['Higienização Diária', 'Shampoo neutro para cílios com água fria'],
      ['Rotina Diária', 'Escovação suave 1 a 2 vezes ao dia'],
      ['Produtos', 'Evitar rímel e demaquilantes à base de óleo']
    ]
  }
];


// Mapeamento de Rótulos de Categoria
const CATEGORIA_LABELS = {
  'cilios': 'Extensão de Cílios',
  'volumes': 'Extensão de Cílios',
  'sobrancelhas': 'Sobrancelhas',
  'especiais': 'Especiais & Cuidados',
  'labios': 'Pigmentação Labial',
  'combos': 'Combos Exclusivos'
};

function getCatLabel(item) {
  if (!item) return '';
  return item.catName || CATEGORIA_LABELS[item.cat] || item.catLabel || (item.cat ? item.cat.toUpperCase() : '');
}

// Elementos DOM
const mosaicoApp = document.querySelector('.mosaico-app');
const sections = document.querySelectorAll('.mosaico-app > section');
const gridEl = document.querySelector('[data-grid]');
const contadorEl = document.querySelector('[data-contador]');
const filtroBtns = document.querySelectorAll('.filtro-chip');
const modalEl = document.querySelector('[data-modal]');
const modalSheetEl = document.querySelector('[data-modal-sheet]');
const modalFecharEl = document.querySelector('[data-modal-fechar]');

var filtroAtivo = 'todos';
window.filtroAtivo = filtroAtivo;

// IntersectionObserver para Disparar Animações por Seção
function initSectionObserver() {
  const observerOptions = {
    root: mosaicoApp,
    threshold: 0.25
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        try {
          if (window.parent && window.parent !== window) {
            const label = entry.target.getAttribute('data-screen-label') || entry.target.id;
            const sectionId = entry.target.id;
            window.parent.postMessage({
              type: 'VITRINE_SCREEN_CHANGE',
              label: label,
              sectionId: sectionId
            }, '*');
          }
        } catch (e) {}
      }
    });
  }, observerOptions);

  sections.forEach((section) => observer.observe(section));
}

// Observer Individual para os Cards do Mosaico (Re-anima suavemente sempre que entra no viewport)
let tileObserver = null;

function initTileObserver() {
  if (tileObserver) {
    tileObserver.disconnect();
  }

  const observerOptions = {
    root: mosaicoApp,
    threshold: 0.08,
    rootMargin: '20px 0px 10px 0px'
  };

  let batchCount = 0;
  let batchTimer = null;

  tileObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const tile = entry.target;
      if (entry.isIntersecting) {
        const delay = (batchCount % 4) * 0.16;
        tile.style.animationDelay = `${delay}s`;
        tile.classList.add('is-revealed');

        batchCount++;
        clearTimeout(batchTimer);
        batchTimer = setTimeout(() => { batchCount = 0; }, 250);
      } else {
        tile.classList.remove('is-revealed');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.tile').forEach((tile) => {
    tileObserver.observe(tile);
  });
}

// Filtragem
function getItensVisiveis() {
  const list = (typeof window.PROCEDIMENTOS !== 'undefined' && Array.isArray(window.PROCEDIMENTOS) && window.PROCEDIMENTOS.length > 0) ? window.PROCEDIMENTOS : PROCEDIMENTOS;
  const f = (typeof window.filtroAtivo !== 'undefined') ? window.filtroAtivo : filtroAtivo;
  if (!f || f === 'todos') return list;
  return list.filter(item => item.cat === f);
}

function atualizarContador() {
  const total = getItensVisiveis().length;
  if (contadorEl) {
    contadorEl.textContent = `Mostrando ${total} procedimento${total !== 1 ? 's' : ''}`;
  }
}

// Exposição Global para o Injetor Dinâmico Supabase
window.PROCEDIMENTOS = PROCEDIMENTOS;
window.renderGrid = renderGrid;

// Renderizar Mosaico
function renderGrid() {
  const lista = getItensVisiveis();
  gridEl.innerHTML = '';

  lista.forEach((item, index) => {
    const tile = document.createElement('article');
    tile.className = 'tile';
    if (item.destaque) tile.classList.add('tile--destaque');

    tile.style.animationDelay = `${(index % 6) * 0.12}s`;
    tile.tabIndex = 0;
    tile.setAttribute('role', 'button');
    tile.setAttribute('aria-label', `Ver detalhes de ${item.title}`);

    tile.innerHTML = `
      <img src="${item.img}" alt="${item.title}" class="tile__foto" loading="lazy">
      <div class="tile__scrim"></div>
      <div class="tile__conteudo">
        <span class="tile__cat">${getCatLabel(item)}</span>
        <h3 class="tile__titulo">${item.title}</h3>
        <div class="tile__meta">
          <span class="tile__preco">${item.preco}</span>
          <span class="tile__duracao">${item.duracao}</span>
        </div>
      </div>
      <div class="tile__toque-cue">
        <span>Toque para detalhes</span>
        <span>+</span>
      </div>
    `;

    tile.addEventListener('click', () => abrirModal(item.id));
    tile.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        abrirModal(item.id);
      }
    });

    gridEl.appendChild(tile);
  });

  atualizarContador();
  initTileObserver();
}

// Filtros
filtroBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filtroBtns.forEach(b => b.classList.remove('is-ativo'));
    btn.classList.add('is-ativo');
    filtroAtivo = btn.dataset.filter;
    renderGrid();
  });
});

// Modal de Detalhes
function abrirModal(id) {
  const item = PROCEDIMENTOS.find(p => p.id === id);
  if (!item) return;

  const lista = getItensVisiveis();
  const idxAtual = lista.findIndex(p => p.id === id);
  const proxItem = lista[(idxAtual + 1) % lista.length];

  const targetPhone = (typeof window !== 'undefined' && window.LASHMENU_CLIENT_PHONE) ? window.LASHMENU_CLIENT_PHONE : '5511999999999';
  const designerName = (typeof window !== 'undefined' && window.LASHMENU_DESIGNER_NAME) ? window.LASHMENU_DESIGNER_NAME : 'Amanda';
  const firstName = designerName.split(' ')[0];
  const mensagemWa = encodeURIComponent(`Olá, ${firstName}! Estava vendo seu catálogo digital e gostaria de agendar o procedimento: *${item.title}*.`);

  modalSheetEl.innerHTML = `
    <div class="modal__foto-wrap">
      <img src="${item.img}" alt="${item.title}" class="modal__foto">
      <div class="modal__scrim"></div>
      <button type="button" class="modal__fechar" aria-label="Fechar" onclick="fecharModal()">✕</button>
    </div>
    <div class="modal__corpo">
      <span class="modal__cat">${getCatLabel(item)}</span>
      <h3 class="modal__titulo">${item.title}</h3>
      <p class="modal__desc">${item.desc}</p>
      
      <div class="modal__specs">
        ${item.specs.map(([k, v]) => `
          <div class="modal__spec">
            <span class="modal__spec-k">${k}</span>
            <span class="modal__spec-v">${v}</span>
          </div>
        `).join('')}
      </div>

      <div class="modal__acoes">
        <a href="https://api.whatsapp.com/send?phone=${targetPhone}&text=${mensagemWa}" target="_blank" rel="noopener" class="modal__cta">
          Agendar ${item.title} →
        </a>
        <button type="button" class="modal__proximo" title="Ver próximo procedimento" onclick="abrirModal('${proxItem.id}')">
          →
        </button>
      </div>
    </div>
  `;

  modalEl.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
}

function fecharModal() {
  modalEl.setAttribute('hidden', '');
  document.body.style.overflow = '';
}

modalFecharEl.addEventListener('click', fecharModal);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modalEl.hasAttribute('hidden')) {
    fecharModal();
  }
});

// Suavização do primeiro scroll da Capa para o topo exato do Mosaico
function initHeroScrollLock() {
  const heroSection = document.querySelector('.hero');
  const catalogoSection = document.querySelector('.secao-catalogo');
  if (!heroSection || !catalogoSection) return;

  let touchStartY = 0;
  let isNavigating = false;

  heroSection.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  heroSection.addEventListener('touchend', (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY - touchEndY;
    // Swipe para cima de pelo menos 25px enquanto estiver na Capa
    if (diffY > 25 && mosaicoApp.scrollTop < 50 && !isNavigating) {
      isNavigating = true;
      mosaicoApp.scrollTo({
        top: catalogoSection.offsetTop,
        behavior: 'smooth'
      });
      setTimeout(() => { isNavigating = false; }, 700);
    }
  }, { passive: true });
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  renderGrid();
  initSectionObserver();
  initHeroScrollLock();

  // Modo Preview Catálogo (Demonstração do Mosaico Navegando de Cima pra Baixo + Efeito de Toque)
  const isCatalogFocus = window.location.search.includes('preview=catalog') || window.location.search.includes('focus=catalog');
  if (isCatalogFocus) {
    const catalogoSection = document.querySelector('.secao-catalogo');

    // Injeta estilo do efeito de toque
    if (!document.getElementById('virtual-tap-style')) {
      const style = document.createElement('style');
      style.id = 'virtual-tap-style';
      style.textContent = `
        .virtual-user-tap {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(229, 152, 173, 0.60) 45%, rgba(255, 255, 255, 0) 75%);
          border: 2px solid rgba(255, 255, 255, 0.95);
          box-shadow: 0 0 18px rgba(255, 255, 255, 0.9), 0 0 32px rgba(229, 152, 173, 0.7);
          transform: translate(-50%, -50%) scale(0.3);
          animation: virtualTapAnim 0.38s cubic-bezier(0.1, 0.7, 0.3, 1) forwards;
          pointer-events: none;
          z-index: 9999;
        }
        @keyframes virtualTapAnim {
          0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0.95; }
          50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.9; }
          100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    function simulateUserTap(element, onComplete) {
      if (!element) { if (onComplete) onComplete(); return; }
      const prevPos = element.style.position;
      if (getComputedStyle(element).position === 'static') {
        element.style.position = 'relative';
      }
      const tap = document.createElement('div');
      tap.className = 'virtual-user-tap';
      element.appendChild(tap);
      element.style.transition = 'transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.18s ease';
      element.style.transform = 'scale(0.93)';
      element.style.filter = 'brightness(1.2)';

      setTimeout(() => {
        element.style.transform = '';
        element.style.filter = '';
        if (tap.parentNode) tap.parentNode.removeChild(tap);
        if (prevPos) element.style.position = prevPos;
        if (onComplete) onComplete();
      }, 340);
    }

    if (catalogoSection && mosaicoApp) {
      const snapToCat = () => {
        mosaicoApp.scrollTop = catalogoSection.offsetTop;
      };
      snapToCat();
      setTimeout(snapToCat, 50);
      setTimeout(snapToCat, 250);
      setTimeout(snapToCat, 600);

      function loop() {
        // 1. Volta ao topo da seção
        mosaicoApp.scrollTo({ top: catalogoSection.offsetTop, behavior: 'smooth' });

        // 2. Rola para baixo suavemente (mostrando mais cards)
        setTimeout(() => {
          mosaicoApp.scrollTo({ top: catalogoSection.offsetTop + 180, behavior: 'smooth' });
        }, 1100);

        // 3. Rola mais um pouco para baixo
        setTimeout(() => {
          mosaicoApp.scrollTo({ top: catalogoSection.offsetTop + 360, behavior: 'smooth' });
        }, 2300);

        // 4. Mostra o toque no card do mosaico e abre os detalhes
        setTimeout(() => {
          const tiles = document.querySelectorAll('.tile');
          const targetTile = tiles[2] || tiles[0];
          if (targetTile) {
            simulateUserTap(targetTile, () => {
              targetTile.click();
            });
          }
        }, 3500);

        // 5. Fecha o modal com toque visual após 1.4s
        setTimeout(() => {
          if (modalFecharEl) {
            simulateUserTap(modalFecharEl, () => {
              fecharModal();
            });
          } else {
            fecharModal();
          }
        }, 5300);

        // 6. Reinicia o ciclo
        setTimeout(loop, 6200);
      }

      setTimeout(loop, 400);
    }
  }
});


/* ---------- Efeito de Partículas Flutuantes Iluminadas (Hero Ambient Glow Particles) ---------- */
(function initHeroParticles() {
  function createParticles() {
    const heroEl = document.querySelector('.hero, .secao-hero, .capa');
    if (!heroEl || heroEl.querySelector('#hero-particles')) return;

    const container = document.createElement('div');
    container.id = 'hero-particles';
    container.className = 'hero__particles';
    heroEl.appendChild(container);

    const isRose = (document.body.className || '').includes('rose') || 
                   (window.location.href || '').includes('rose') || 
                   (document.title || '').includes('Rose');

    const particleColor = isRose ? 'rgba(229, 169, 184, 0.9)' : 'rgba(226, 194, 170, 0.9)';
    const particleGlow = isRose ? 'rgba(169, 50, 89, 0.45)' : 'rgba(201, 163, 137, 0.45)';
    const particleBoxGlow = isRose ? 'rgba(229, 169, 184, 0.65)' : 'rgba(201, 163, 137, 0.65)';

    let html = '';
    for (let i = 0; i < 14; i++) {
      const size = Math.floor(Math.random() * 8) + 6;
      const left = Math.floor(Math.random() * 90) + 5;
      const duration = (Math.random() * 4 + 4.5).toFixed(1);
      const delay = (Math.random() * 5).toFixed(1);
      const maxOpacity = (Math.random() * 0.4 + 0.4).toFixed(2);

      html += `<span class="hero__particle" style="left: ${left}%; width: ${size}px; height: ${size}px; --duration: ${duration}s; --delay: ${delay}s; --max-opacity: ${maxOpacity}; background: radial-gradient(circle, ${particleColor} 0%, ${particleGlow} 70%, transparent 100%); box-shadow: 0 0 10px ${particleBoxGlow};"></span>`;
    }
    container.innerHTML = html;

    if (!document.getElementById('hero-particles-styles')) {
      const pStyle = document.createElement('style');
      pStyle.id = 'hero-particles-styles';
      pStyle.innerHTML = `
        .hero__particles { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 2; }
        .hero__particle { position: absolute; bottom: -20px; border-radius: 50%; opacity: 0; pointer-events: none; will-change: transform, opacity; animation: floatHeroParticle var(--duration, 6s) infinite ease-in-out var(--delay, 0s); }
        @keyframes floatHeroParticle {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          20% { opacity: var(--max-opacity, 0.7); }
          75% { opacity: var(--max-opacity, 0.7); }
          100% { transform: translateY(-52vh) scale(1.15); opacity: 0; }
        }
      `;
      document.head.appendChild(pStyle);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createParticles);
  } else {
    createParticles();
  }
})();


/* ---------- LASHMENU UNIFIED THEME SWITCHER (ROSÉ 🌸 / LUXURY 👑) ---------- */
(function initThemeSwitcher() {
  function setupSwitcher() {
    const buttons = document.querySelectorAll('[data-theme-target]');
    if (buttons.length === 0) return;

    let savedTheme = localStorage.getItem('lash_mosaico_theme') || 'rose';

    function setTheme(theme) {
      document.body.setAttribute('data-theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('lash_mosaico_theme', theme);

      buttons.forEach(btn => {
        if (btn.getAttribute('data-theme-target') === theme) {
          btn.classList.add('is-active');
        } else {
          btn.classList.remove('is-active');
        }
      });

      if (typeof window.initHeroParticles === 'function') {
        window.initHeroParticles();
      }
    }

    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const theme = btn.getAttribute('data-theme-target');
        setTheme(theme);
      });
    });

    setTheme(savedTheme);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSwitcher);
  } else {
    setupSwitcher();
  }
})();
