document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sections = document.querySelectorAll('.vitrine > section');
  const fotoWraps = document.querySelectorAll(
    '.hero__foto-wrap, .procedimentos__foto-wrap, .agendamento__foto-wrap, .cuidados__foto-wrap, .contato__foto-wrap'
  );

  // Set initial scales for photo wraps
  if (fotoWraps.length > 0 && typeof gsap !== 'undefined') {
    gsap.set(fotoWraps, { scale: 1 });
  }

  // IntersectionObserver to handle active section snap detection & animations (1 scroll = 1 section snap model)
  const observerOptions = {
    root: document.querySelector('.vitrine'),
    threshold: 0.5,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const section = entry.target;
      const wrap = section.querySelector(
        '.hero__foto-wrap, .procedimentos__foto-wrap, .agendamento__foto-wrap, .cuidados__foto-wrap, .contato__foto-wrap'
      );

      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        section.classList.add('is-active');

        // Ken Burns zoom effect on background photo when section becomes active
        if (wrap && !reduceMotion && typeof gsap !== 'undefined') {
          gsap.to(wrap, {
            scale: 1.08,
            duration: 7,
            ease: 'sine.out',
            overwrite: 'auto',
          });
        }
      } else {
        section.classList.remove('is-active');

        // Reset photo scale smoothly when section is left
        if (wrap && !reduceMotion && typeof gsap !== 'undefined') {
          gsap.to(wrap, {
            scale: 1,
            duration: 0.6,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        }
      }
    });
  }, observerOptions);

  sections.forEach((section) => observer.observe(section));
});

/* ---------- Detalhe do procedimento (modal) ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const PROCEDIMENTOS = [
    {
      id: 'brasileiro', img: 'assets/img/volume-brasileiro.png', alt: 'Volume brasileiro em cílios',
      cat: 'Extensão em Y', nome: 'Volume Brasileiro',
      desc: 'Fios tecnológicos com formato Y que preenchem as falhas naturais com leveza incomparável, alta durabilidade e acabamento marcante.',
      specs: [
        ['Investimento', 'R$ 150'],
        ['Manutenção', 'R$ 90 (até 20 dias)'],
        ['Duração', '1h30'],
        ['Efeito', 'Preenchimento, Textura & Leveza'],
      ],
    },
    {
      id: 'classico', img: 'assets/img/classico-fio-a-fio.png', alt: 'Extensão de cílios clássico fio a fio',
      cat: 'Fio a Fio Clássico', nome: 'Clássico Fio a Fio',
      desc: 'Um fio sintético ultrafino acoplado a cada cílio natural saudável. O resultado mais elegante e discreto: olhar iluminado com efeito de rímel perfeito.',
      specs: [
        ['Investimento', 'R$ 120'],
        ['Manutenção', 'R$ 70 (até 18 dias)'],
        ['Duração', '1h30'],
        ['Efeito', 'Natural, Discreto & Elegante'],
      ],
    },
    {
      id: 'egipcio', img: 'assets/img/volume-egipcio.png', alt: 'Aplicação de volume egípcio',
      cat: 'Extensão em W', nome: 'Volume Egípcio',
      desc: 'Fios especiais em formato W (3D tecnológico) que proporcionam densidade homogênea, efeito aveludado e volume equilibrado sem pesar nos olhos.',
      specs: [
        ['Investimento', 'R$ 160'],
        ['Manutenção', 'R$ 95 (até 20 dias)'],
        ['Duração', '1h30'],
        ['Efeito', 'Densidade Aveludada & Uniforme'],
      ],
    },
    {
      id: 'hibrido', img: 'assets/img/volume-hibrido.png', alt: 'Volume híbrido de cílios',
      cat: 'Clássico + Volume', nome: 'Volume Híbrido',
      desc: 'A combinação artesanal entre a delicadeza do fio a fio clássico e leques de volume, criando textura multidimensional, profundidade e brilho no olhar.',
      specs: [
        ['Investimento', 'R$ 160'],
        ['Manutenção', 'R$ 95 (até 20 dias)'],
        ['Duração', '1h45'],
        ['Efeito', 'Textura Desconstruída & Volume Sob Medida'],
      ],
    },
    {
      id: 'russo', img: 'assets/img/volume-russo.png', alt: 'Volume russo com fans artesanais',
      cat: 'Fans Artesanais 3D–6D', nome: 'Volume Russo',
      desc: 'Técnica de alta precisão com fans ultrafinos (3 a 6 fios de seda) montados à mão na hora. Cria um volume expressivo, extremamente macio, denso e sofisticado.',
      specs: [
        ['Investimento', 'R$ 190'],
        ['Manutenção', 'R$ 110 (até 20 dias)'],
        ['Duração', '2h00'],
        ['Efeito', 'Glamour, Densidade & Toque de Pluma'],
      ],
    },
    {
      id: 'mega', img: 'assets/img/mega-volume.png', alt: 'Mega volume com densidade máxima',
      cat: 'Densidade Máxima 8D–12D', nome: 'Mega Volume',
      desc: 'O ápice da densidade e do impacto visual: leques artesanais com fios ultrafinos de 0.03mm. Proporciona um olhar super pretinho, aveludado e hipnotizante.',
      specs: [
        ['Investimento', 'R$ 240'],
        ['Manutenção', 'R$ 140 (até 18 dias)'],
        ['Duração', '2h30'],
        ['Efeito', 'Impacto Máximo, Densidade Total & Preto Profundo'],
      ],
    },
    {
      id: 'gatinho', img: 'assets/img/mapping-gatinho.png', alt: 'Mapping gatinho com efeito alongado',
      cat: 'Mapping de Olhar', nome: 'Mapping Gatinho',
      desc: 'Crescimento milimétrico dos fios em direção ao canto externo. Alonga o olhar, cria um efeito felino refinado e valoriza o contorno dos olhos.',
      specs: [
        ['Investimento', 'Incluso na técnica escolhida'],
        ['Estilo de Design', 'Alongado / Felino'],
        ['Indicação', 'Olhos amendoados, redondos ou juntos'],
        ['Combinações', 'Brasileiro, Russo, Híbrido e Clássico']
      ],
    },
    {
      id: 'boneca', img: 'assets/img/mapping-boneca.png', alt: 'Mapping boneca desenhado no olho',
      cat: 'Mapping de Olhar', nome: 'Mapping Boneca',
      desc: 'Fios com maior comprimento posicionados estrategicamente no centro da íris. Abre e ilumina o olhar, proporcionando aspecto doce, expressivo e jovial.',
      specs: [
        ['Investimento', 'Incluso na técnica escolhida'],
        ['Estilo de Design', 'Olhar Aberto / Centralizado'],
        ['Indicação', 'Olhos caídos, fundos ou orientais'],
        ['Combinações', 'Clássico, Brasileiro e Egípcio']
      ],
    },
    {
      id: 'esquilo', img: 'assets/img/mapping-esquilo.png', alt: 'Mapping esquilo com efeito lifting',
      cat: 'Mapping de Olhar', nome: 'Mapping Esquilo',
      desc: 'Pico de comprimento posicionado exatamente no arco da sobrancelha (ponto alto). Disfarça pálpebra caída e cria um efeito de lifting imediato.',
      specs: [
        ['Investimento', 'Incluso na técnica escolhida'],
        ['Estilo de Design', 'Efeito Lifting da Pálpebra'],
        ['Indicação', 'Pálpebras gordinhas, caídas ou maduras'],
        ['Combinações', 'Híbrido, Russo e Egípcio']
      ],
    },
    {
      id: 'fox', img: 'assets/img/fox-eyes.png', alt: 'Efeito fox eyes em cílios',
      cat: 'Design Assinatura', nome: 'Fox Eyes Signature',
      desc: 'O desenho de maior sucesso do estúdio: extremidade externa esticada e alinhada com mapping milimétrico para um visual sensual, moderno e marcante.',
      specs: [
        ['Investimento', 'R$ 170'],
        ['Manutenção', 'R$ 100 (até 20 dias)'],
        ['Duração', '1h45'],
        ['Efeito', 'Lifting, Puxado & Olhar Felino Marcante'],
      ],
    },
    {
      id: 'lifting', img: 'assets/img/lash-lifting.png', alt: 'Procedimento de lash lifting',
      cat: 'Cílios Naturais', nome: 'Lash Lifting & Nutrição',
      desc: 'Tratamento de curvatura, nutrição profunda com queratina e tintura preta nos seus próprios cílios naturais. Zero manutenção e durabilidade de 6 a 8 semanas.',
      specs: [
        ['Investimento', 'R$ 130'],
        ['Duração', '1h00'],
        ['Durabilidade do Efeito', '6 a 8 semanas (acompanha o ciclo natural)'],
        ['Manutenção Diária', 'Zero manutenção — livre para usar rímel']
      ],
    },
    {
      id: 'remocao', img: 'assets/img/remocao.png', alt: 'Remoção de extensão de cílios',
      cat: 'Segurança & Saúde', nome: 'Remoção Segura',
      desc: 'Remoção química indolor realizada com gel removedor profissional específico que dissolve o adesivo sem tracionar ou danificar nenhum fio natural.',
      specs: [
        ['Investimento', 'R$ 50'],
        ['Duração', '30 minutos'],
        ['Segurança', 'Preservação de 100% da integridade dos fios naturais'],
        ['Indicação', 'Remoção de extensões anteriores ou pausa']
      ],
    },
    {
      id: 'cuidados', img: 'assets/img/cuidados.jpg', alt: 'Guia de cuidados pós-aplicação',
      cat: 'Guia de Durabilidade', nome: 'Cuidados Pós-Aplicação',
      desc: 'Orientações práticas para prolongar a retenção dos seus cílios: evitar água nas primeiras 24h, higienizar com shampoo neutro e escovar diariamente.',
      specs: [
        ['Primeiras 24 Horas', 'Não molhar e evitar vapor/sauna'],
        ['Higienização Diária', 'Shampoo neutro para cílios com água fria'],
        ['Rotina Diária', 'Escovação suave 1 a 2 vezes ao dia'],
        ['Produtos', 'Evitar rímel e demaquilantes à base de óleo']
      ],
    },
  ];

  const vitrine = document.querySelector('.vitrine');
  const cards = document.querySelectorAll('.card-procedimento');
  const modal = document.querySelector('[data-detalhe]');
  const sheet = document.querySelector('[data-detalhe-sheet]');
  if (!vitrine || !modal || !sheet || cards.length === 0) return;

  let openId = null;

  function render(item) {
    const specsHtml = item.specs.map(([k, v]) => `
      <div class="detalhe-procedimento__spec">
        <span class="detalhe-procedimento__spec-k">${k}</span>
        <span class="detalhe-procedimento__spec-v">${v}</span>
      </div>
    `).join('');

    const mensagemWa = encodeURIComponent(`Olá Mariana! Gostaria de agendar o procedimento de ${item.nome}.`);

    sheet.innerHTML = `
      <div class="detalhe-procedimento__foto-wrap">
        <img src="${item.img}" alt="${item.alt}" class="detalhe-procedimento__foto">
        <span class="detalhe-procedimento__scrim"></span>
        <button type="button" class="detalhe-procedimento__fechar" data-fechar aria-label="Fechar">×</button>
      </div>
      <div class="detalhe-procedimento__corpo">
        <span class="detalhe-procedimento__cat">${item.cat}</span>
        <h2 class="detalhe-procedimento__titulo">${item.nome}</h2>
        <p class="detalhe-procedimento__desc">${item.desc}</p>
        <div class="detalhe-procedimento__specs">${specsHtml}</div>
        <div class="detalhe-procedimento__acoes">
          <a href="https://wa.me/5511999999999?text=${mensagemWa}" class="detalhe-procedimento__cta" target="_blank" rel="noopener">Quero esse</a>
          <button type="button" class="detalhe-procedimento__proximo" data-proximo aria-label="Próximo procedimento">→</button>
        </div>
      </div>
    `;

    sheet.querySelector('[data-fechar]').addEventListener('click', close);
    sheet.querySelector('[data-proximo]').addEventListener('click', next);
  }

  function open(id) {
    openId = id;
    const item = PROCEDIMENTOS.find((p) => p.id === id);
    if (!item) return;
    render(item);
    modal.hidden = false;
    vitrine.classList.add('modal-aberto');

    if (reduceMotion || typeof gsap === 'undefined') return;
    gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: .2, ease: 'power1.out' });
    gsap.fromTo(sheet, { yPercent: 100 }, { yPercent: 0, duration: .42, ease: 'expo.out' });
  }

  function close() {
    const finish = () => {
      modal.hidden = true;
      vitrine.classList.remove('modal-aberto');
      openId = null;
    };
    if (reduceMotion || typeof gsap === 'undefined') { finish(); return; }
    gsap.to(sheet, { yPercent: 100, duration: .32, ease: 'power2.in' });
    gsap.to(modal, { opacity: 0, duration: .32, ease: 'power1.in', onComplete: finish });
  }

  function next() {
    const idx = PROCEDIMENTOS.findIndex((p) => p.id === openId);
    const nextItem = PROCEDIMENTOS[(idx + 1) % PROCEDIMENTOS.length];
    openId = nextItem.id;
    if (reduceMotion || typeof gsap === 'undefined') { render(nextItem); return; }
    gsap.to(sheet, {
      opacity: 0,
      duration: .12,
      ease: 'power1.in',
      onComplete: () => {
        render(nextItem);
        gsap.fromTo(sheet, { opacity: 0 }, { opacity: 1, duration: .18, ease: 'power1.out' });
      },
    });
  }

  cards.forEach((card) => {
    const id = card.dataset.proc;
    const item = PROCEDIMENTOS.find((p) => p.id === id);
    if (!item) return;
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Ver detalhes de ' + item.nome);
    card.addEventListener('click', () => open(id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(id); }
    });
  });

  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
});

/* ---------- Modo Preview / Auto-Tour no Mockup Controlado por Visibilidade ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const isPreview = window.location.search.includes('preview') || window.self !== window.top;
  if (!isPreview) return;

  const vitrine = document.querySelector('.vitrine');
  const sections = Array.from(document.querySelectorAll('.vitrine > section'));
  if (!vitrine || sections.length === 0) return;

  // Modo Focus Catalog (Apresentação do Catálogo Animado no Showroom com Efeito Visual de Toque)
  const isCatalogFocus = window.location.search.includes('preview=catalog') || window.location.search.includes('focus=catalog');
  if (isCatalogFocus) {
    const procSection = document.querySelector('.procedimentos');
    const track = document.querySelector('.procedimentos__lista');
    const modal = document.querySelector('[data-detalhe]');
    const cards = document.querySelectorAll('.card-procedimento');

    // Injeta estilo do efeito de toque (Ripple de dedo)
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

    if (procSection) {
      vitrine.style.scrollSnapType = 'none';
      const snapToProc = () => {
        vitrine.scrollTop = procSection.offsetTop;
      };
      snapToProc();
      setTimeout(snapToProc, 50);
      setTimeout(snapToProc, 200);
      setTimeout(snapToProc, 500);
      window.addEventListener('resize', snapToProc);

      if (track && cards.length) {
        function loop() {
          // 1. Volta ao início suavemente
          track.scrollTo({ left: 0, behavior: 'smooth' });

          // 2. Desliza para o card 1
          setTimeout(() => {
            const cardW = track.clientWidth * 0.76;
            track.scrollTo({ left: cardW * 1, behavior: 'smooth' });
          }, 1100);

          // 3. Desliza para o card 2
          setTimeout(() => {
            const cardW = track.clientWidth * 0.76;
            track.scrollTo({ left: cardW * 2, behavior: 'smooth' });
          }, 2300);

          // 4. Mostra o toque do usuário no card e abre o modal de detalhes
          setTimeout(() => {
            const targetCard = cards[2] || cards[0];
            simulateUserTap(targetCard, () => {
              targetCard.click();
            });
          }, 3500);

          // 5. Fecha o modal com toque visual após 1.4s
          setTimeout(() => {
            const closeBtn = document.querySelector('[data-fechar]');
            if (closeBtn) {
              simulateUserTap(closeBtn, () => {
                closeBtn.click();
              });
            } else if (modal) {
              modal.hidden = true;
              vitrine.classList.remove('modal-aberto');
            }
          }, 5300);

          // 6. Reinicia o ciclo
          setTimeout(loop, 6200);
        }

        setTimeout(loop, 400);
      }
    }
    return; // Não executa o tour geral de seções
  }

  let currentIdx = 0;
  let timerId = null;
  let isRunning = false;

  function stopTourAndReset() {
    isRunning = false;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    currentIdx = 0;
    vitrine.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  function scheduleNext() {
    if (!isRunning) return;
    const currentSection = sections[currentIdx];
    const isHero = currentSection && currentSection.classList.contains('hero');
    const delay = isHero ? 6000 : 4500;

    timerId = setTimeout(() => {
      if (!isRunning) return;
      currentIdx = (currentIdx + 1) % sections.length;
      const targetSection = sections[currentIdx];

      if (targetSection) {
        vitrine.scrollTo({
          top: targetSection.offsetTop,
          behavior: 'smooth'
        });
      }
      scheduleNext();
    }, delay);
  }

  function startTour() {
    if (isRunning) return;
    isRunning = true;
    scheduleNext();
  }

  window.addEventListener('message', (event) => {
    if (!event.data) return;
    if (event.data.type === 'START_TOUR') {
      startTour();
    } else if (event.data.type === 'RESET_TOUR') {
      stopTourAndReset();
    }
  });
});


