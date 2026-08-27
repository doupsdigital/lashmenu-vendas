/* ==========================================================================
   LASHMENU — MODELO STUDIO DARK (JS COM FILTROS, ANIMAÇÕES E MODAL)
   ========================================================================== */

var PROCEDIMENTOS = [
  // --- 1. EXTENSÕES & VOLUMES ---
  {
    id: 'classico',
    cat: 'volumes',
    catLabel: 'Fio a Fio Clássico',
    title: 'Clássico Fio a Fio',
    preco: 'R$ 120',
    duracao: '1h30',
    img: 'assets/img/classico-fio-a-fio.png',
    desc: 'Um fio sintético ultrafino acoplado a cada cílio natural saudável. O resultado mais elegante e discreto: olhar iluminado com efeito de rímel perfeito.',
    specs: [
      ['Investimento', 'R$ 120'],
      ['Manutenção', 'R$ 70 (até 18 dias)'],
      ['Duração', '1h30'],
      ['Efeito', 'Natural, Discreto & Elegante'],
      ['Recomendação', 'Mínimo de 40% dos fios para manutenção']
    ]
  },
  {
    id: 'brasileiro',
    cat: 'volumes',
    catLabel: 'Extensão em Y',
    title: 'Volume Brasileiro',
    preco: 'R$ 150',
    duracao: '1h30',
    img: 'assets/img/volume-brasileiro.png',
    destaque: true,
    desc: 'Fios tecnológicos com formato Y que preenchem as falhas naturais com leveza incomparável, alta durabilidade e acabamento marcante.',
    specs: [
      ['Investimento', 'R$ 150'],
      ['Manutenção', 'R$ 90 (até 20 dias)'],
      ['Duração', '1h30'],
      ['Efeito', 'Preenchimento, Textura & Leveza'],
      ['Recomendação', 'Mínimo de 40% dos fios para manutenção']
    ]
  },
  {
    id: 'egipcio',
    cat: 'volumes',
    catLabel: 'Extensão em W',
    title: 'Volume Egípcio',
    preco: 'R$ 160',
    duracao: '1h30',
    img: 'assets/img/volume-egipcio.png',
    desc: 'Fios especiais em formato W (3D tecnológico) que proporcionam densidade homogênea, efeito aveludado e volume equilibrado sem pesar nos olhos.',
    specs: [
      ['Investimento', 'R$ 160'],
      ['Manutenção', 'R$ 95 (até 20 dias)'],
      ['Duração', '1h30'],
      ['Efeito', 'Densidade Aveludada & Uniforme'],
      ['Recomendação', 'Mínimo de 40% dos fios para manutenção']
    ]
  },
  {
    id: 'hibrido',
    cat: 'volumes',
    catLabel: 'Clássico + Volume',
    title: 'Volume Híbrido',
    preco: 'R$ 160',
    duracao: '1h45',
    img: 'assets/img/volume-hibrido.png',
    desc: 'A combinação artesanal entre a delicadeza do fio a fio clássico e leques de volume, criando textura multidimensional, profundidade e brilho no olhar.',
    specs: [
      ['Investimento', 'R$ 160'],
      ['Manutenção', 'R$ 95 (até 20 dias)'],
      ['Duração', '1h45'],
      ['Efeito', 'Textura Desconstruída & Volume Sob Medida'],
      ['Recomendação', 'Mínimo de 40% dos fios para manutenção']
    ]
  },
  {
    id: 'russo',
    cat: 'volumes',
    catLabel: 'Fans Artesanais 3D–6D',
    title: 'Volume Russo',
    preco: 'R$ 190',
    duracao: '2h00',
    img: 'assets/img/volume-russo.png',
    destaque: true,
    desc: 'Técnica de alta precisão com fans ultrafinos (3 a 6 fios de seda) montados à mão na hora. Cria um volume expressivo, extremamente macio, denso e sofisticado.',
    specs: [
      ['Investimento', 'R$ 190'],
      ['Manutenção', 'R$ 110 (até 20 dias)'],
      ['Duração', '2h00'],
      ['Efeito', 'Glamour, Densidade & Toque de Pluma'],
      ['Recomendação', 'Mínimo de 40% dos fios para manutenção']
    ]
  },
  {
    id: 'mega',
    cat: 'volumes',
    catLabel: 'Densidade Máxima 8D–12D',
    title: 'Mega Volume',
    preco: 'R$ 240',
    duracao: '2h30',
    img: 'assets/img/mega-volume.png',
    destaque: true,
    desc: 'O ápice da densidade e do impacto visual: leques artesanais com fios ultrafinos de 0.03mm. Proporciona um olhar super pretinho, aveludado e hipnotizante.',
    specs: [
      ['Investimento', 'R$ 240'],
      ['Manutenção', 'R$ 140 (até 18 dias)'],
      ['Duração', '2h30'],
      ['Efeito', 'Impacto Máximo, Densidade Total & Preto Profundo'],
      ['Recomendação', 'Mínimo de 40% dos fios para manutenção']
    ]
  },

  // --- 2. MAPPINGS DE OLHAR (DESIGNS PERSONALIZADOS) ---
  {
    id: 'gatinho',
    cat: 'mapping',
    catLabel: 'Mapping de Olhar',
    title: 'Mapping Gatinho',
    preco: 'Incluso',
    duracao: 'Design',
    img: 'assets/img/mapping-gatinho.png',
    desc: 'Crescimento milimétrico dos fios em direção ao canto externo. Alonga o olhar, cria um efeito felino refinado e valoriza o contorno dos olhos.',
    specs: [
      ['Investimento', 'Incluso na técnica escolhida'],
      ['Estilo de Design', 'Alongado / Felino'],
      ['Indicação', 'Olhos amendoados, redondos ou juntos'],
      ['Combinações', 'Brasileiro, Russo, Híbrido e Clássico']
    ]
  },
  {
    id: 'boneca',
    cat: 'mapping',
    catLabel: 'Mapping de Olhar',
    title: 'Mapping Boneca',
    preco: 'Incluso',
    duracao: 'Design',
    img: 'assets/img/mapping-boneca.png',
    desc: 'Fios com maior comprimento posicionados estrategicamente no centro da íris. Abre e ilumina o olhar, proporcionando aspecto doce, expressivo e jovial.',
    specs: [
      ['Investimento', 'Incluso na técnica escolhida'],
      ['Estilo de Design', 'Olhar Aberto / Centralizado'],
      ['Indicação', 'Olhos caídos, fundos ou orientais'],
      ['Combinações', 'Clássico, Brasileiro e Egípcio']
    ]
  },
  {
    id: 'esquilo',
    cat: 'mapping',
    catLabel: 'Mapping de Olhar',
    title: 'Mapping Esquilo',
    preco: 'Incluso',
    duracao: 'Design',
    img: 'assets/img/mapping-esquilo.png',
    desc: 'Pico de comprimento posicionado exatamente no arco da sobrancelha (ponto alto). Disfarça pálpebra caída e cria um efeito de lifting imediato.',
    specs: [
      ['Investimento', 'Incluso na técnica escolhida'],
      ['Estilo de Design', 'Efeito Lifting da Pálpebra'],
      ['Indicação', 'Pálpebras gordinhas, caídas ou maduras'],
      ['Combinações', 'Híbrido, Russo e Egípcio']
    ]
  },
  {
    id: 'fox',
    cat: 'mapping',
    catLabel: 'Design Assinatura',
    title: 'Fox Eyes Signature',
    preco: 'R$ 170',
    duracao: '1h45',
    img: 'assets/img/fox-eyes.png',
    destaque: true,
    desc: 'O desenho de maior sucesso do estúdio: extremidade externa esticada e alinhada com mapping milimétrico para um visual sensual, moderno e marcante.',
    specs: [
      ['Investimento', 'R$ 170'],
      ['Manutenção', 'R$ 100 (até 20 dias)'],
      ['Duração', '1h45'],
      ['Efeito', 'Lifting, Puxado & Olhar Felino Marcante'],
      ['Recomendação', 'Mínimo de 40% dos fios para manutenção']
    ]
  },

  // --- 3. ESPECIAIS & CUIDADOS ---
  {
    id: 'lifting',
    cat: 'especiais',
    catLabel: 'Cílios Naturais',
    title: 'Lash Lifting & Nutrição',
    preco: 'R$ 130',
    duracao: '1h00',
    img: 'assets/img/lash-lifting.png',
    destaque: true,
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

// Elementos DOM
const studioApp = document.querySelector('.studio-app');
const sections = document.querySelectorAll('.studio-app > section');
const listaEl = document.querySelector('[data-lista]');
const filtroBtns = document.querySelectorAll('.filtro-chip');
const modalEl = document.querySelector('[data-modal]');
const modalSheetEl = document.querySelector('[data-modal-sheet]');
const modalFecharEl = document.querySelector('[data-modal-fechar]');

let filtroAtivo = 'todos';

// IntersectionObserver para Disparar Animações por Seção
function initSectionObserver() {
  const observerOptions = {
    root: studioApp,
    threshold: 0.2
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, observerOptions);

  sections.forEach((section) => observer.observe(section));
}

// Observer Individual para os Cards da Lista (Re-anima suavemente sempre que entra no viewport)
let cardObserver = null;

function initCardObserver() {
  if (cardObserver) {
    cardObserver.disconnect();
  }

  const observerOptions = {
    root: studioApp,
    threshold: 0.08,
    rootMargin: '20px 0px 10px 0px'
  };

  let batchCount = 0;
  let batchTimer = null;

  cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const card = entry.target;
      if (entry.isIntersecting) {
        const delay = (batchCount % 4) * 0.16;
        card.style.animationDelay = `${delay}s`;
        card.classList.add('is-revealed');

        batchCount++;
        clearTimeout(batchTimer);
        batchTimer = setTimeout(() => { batchCount = 0; }, 250);
      } else {
        card.classList.remove('is-revealed');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.servico-card').forEach((card) => {
    cardObserver.observe(card);
  });
}

// Filtragem
function getItensVisiveis() {
  if (filtroAtivo === 'todos') return PROCEDIMENTOS;
  return PROCEDIMENTOS.filter(item => item.cat === filtroAtivo);
}

// Exposição Global para o Injetor Dinâmico Supabase
window.PROCEDIMENTOS = PROCEDIMENTOS;
window.renderLista = renderLista;

// Renderizar Lista Editorial
function renderLista() {
  const lista = getItensVisiveis();
  listaEl.innerHTML = '';

  lista.forEach((item, index) => {
    const card = document.createElement('article');
    card.className = 'servico-card';
    card.style.animationDelay = `${(index % 8) * 0.10}s`;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Ver detalhes de ${item.title}`);

    card.innerHTML = `
      <div class="servico-card__foto-box">
        <img src="${item.img}" alt="${item.title}" class="servico-card__foto" loading="lazy">
      </div>
      <div class="servico-card__conteudo">
        <span class="servico-card__cat">${item.catLabel}</span>
        <h3 class="servico-card__titulo">${item.title}</h3>
        <p class="servico-card__desc">${item.desc}</p>
      </div>
      <div class="servico-card__lado-dir">
        <span class="servico-card__preco">${item.preco}</span>
        <span class="servico-card__duracao">${item.duracao}</span>
        <span class="servico-card__seta">→</span>
      </div>
    `;

    card.addEventListener('click', () => abrirModal(item.id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        abrirModal(item.id);
      }
    });

    listaEl.appendChild(card);
  });

  initCardObserver();
}

// Filtros
filtroBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filtroBtns.forEach(b => b.classList.remove('is-ativo'));
    btn.classList.add('is-ativo');
    filtroAtivo = btn.dataset.filter;
    renderLista();
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
  const designerName = (typeof window !== 'undefined' && window.LASHMENU_DESIGNER_NAME) ? window.LASHMENU_DESIGNER_NAME : 'Bruna';
  const firstName = designerName.split(' ')[0];
  const mensagemWa = encodeURIComponent(`Olá, ${firstName}! Estava vendo seu catálogo digital e gostaria de agendar o procedimento: *${item.title}*.`);

  modalSheetEl.innerHTML = `
    <div class="modal__foto-wrap">
      <img src="${item.img}" alt="${item.title}" class="modal__foto">
      <div class="modal__scrim"></div>
      <button type="button" class="modal__fechar" aria-label="Fechar" onclick="fecharModal()">✕</button>
    </div>
    <div class="modal__corpo">
      <span class="modal__cat">${item.catLabel}</span>
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
        <button type="button" class="modal__proximo" title="Ver próximo serviço" onclick="abrirModal('${proxItem.id}')">
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

// Suavização do primeiro scroll da Capa para o topo exato do Menu
function initHeroScrollLock() {
  const heroSection = document.querySelector('.hero');
  const menuSection = document.querySelector('.secao-menu');
  if (!heroSection || !menuSection) return;

  let touchStartY = 0;
  let isNavigating = false;

  heroSection.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  heroSection.addEventListener('touchend', (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY - touchEndY;
    // Swipe para cima de pelo menos 25px enquanto estiver na Capa
    if (diffY > 25 && studioApp.scrollTop < 50 && !isNavigating) {
      isNavigating = true;
      studioApp.scrollTo({
        top: menuSection.offsetTop,
        behavior: 'smooth'
      });
      setTimeout(() => { isNavigating = false; }, 700);
    }
  }, { passive: true });
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  renderLista();
  initSectionObserver();
  initHeroScrollLock();

  // Modo Preview Catálogo (Demonstração da Lista Editorial Navegando de Cima pra Baixo + Efeito de Toque)
  const isCatalogFocus = window.location.search.includes('preview=catalog') || window.location.search.includes('focus=catalog');
  if (isCatalogFocus) {
    const menuSection = document.querySelector('.secao-menu');

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
          background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(212, 163, 115, 0.55) 45%, rgba(255, 255, 255, 0) 75%);
          border: 2px solid rgba(255, 255, 255, 0.95);
          box-shadow: 0 0 18px rgba(255, 255, 255, 0.9), 0 0 32px rgba(212, 163, 115, 0.7);
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

    if (menuSection && studioApp) {
      const snapToMenu = () => {
        studioApp.scrollTop = menuSection.offsetTop;
      };
      snapToMenu();
      setTimeout(snapToMenu, 50);
      setTimeout(snapToMenu, 250);
      setTimeout(snapToMenu, 600);

      function loop() {
        // 1. Volta ao topo da seção
        studioApp.scrollTo({ top: menuSection.offsetTop, behavior: 'smooth' });

        // 2. Rola para baixo na lista editorial
        setTimeout(() => {
          studioApp.scrollTo({ top: menuSection.offsetTop + 180, behavior: 'smooth' });
        }, 1100);

        // 3. Rola mais um pouco para baixo
        setTimeout(() => {
          studioApp.scrollTo({ top: menuSection.offsetTop + 360, behavior: 'smooth' });
        }, 2300);

        // 4. Mostra o toque no item da lista e abre o modal de detalhes
        setTimeout(() => {
          const cards = document.querySelectorAll('.servico-card');
          const targetCard = cards[2] || cards[0];
          if (targetCard) {
            simulateUserTap(targetCard, () => {
              targetCard.click();
            });
          } else if (typeof abrirModal === 'function' && typeof PROCEDIMENTOS !== 'undefined') {
            abrirModal(PROCEDIMENTOS[1].id);
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
