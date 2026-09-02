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

    const targetPhone = (typeof window !== 'undefined' && window.LASHMENU_CLIENT_PHONE) ? window.LASHMENU_CLIENT_PHONE : '5511999999999';
    const designerName = (typeof window !== 'undefined' && window.LASHMENU_DESIGNER_NAME) ? window.LASHMENU_DESIGNER_NAME : 'Mariana';
    const firstName = designerName.split(' ')[0];
    const mensagemWa = encodeURIComponent(`Olá, ${firstName}! Estava vendo seu catálogo digital e gostaria de agendar o procedimento: *${item.nome}*.`);

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
          <a href="https://api.whatsapp.com/send?phone=${targetPhone}&text=${mensagemWa}" class="detalhe-procedimento__cta" target="_blank" rel="noopener">Quero esse</a>
          <button type="button" class="detalhe-procedimento__proximo" data-proximo aria-label="Próximo procedimento">→</button>
        </div>
      </div>
    `;

    sheet.querySelector('[data-fechar]').addEventListener('click', close);
    sheet.querySelector('[data-proximo]').addEventListener('click', next);
  }

  function open(id) {
    openId = id;
    const list = (window.PROCEDIMENTOS && window.PROCEDIMENTOS.length > 0) ? window.PROCEDIMENTOS : PROCEDIMENTOS;
    const item = list.find((p) => p.id === id || p.id === `proc_${id}` || p.id === id.toString().replace('proc_', ''));
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
    const list = (window.PROCEDIMENTOS && window.PROCEDIMENTOS.length > 0) ? window.PROCEDIMENTOS : PROCEDIMENTOS;
    const idx = list.findIndex((p) => p.id === openId);
    if (idx === -1) return;
    const nextItem = list[(idx + 1) % list.length];
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

  // Expose to window for catalog-injector compatibility
  window.PROCEDIMENTOS = PROCEDIMENTOS;
  window.abrirModal = open;
});
