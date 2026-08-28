/* ==========================================================================
   LASHMENU — FORMULÁRIO DE ONBOARDING MULTI-STEP (JAVASCRIPT)
   COM OPÇÃO 2: 3 CARDS DE MODELOS COM SELETOR DE COR DIRETO
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initWelcomeScreen();
  initMultiStepNavigation();
  initModelCardsSelection();
  initServicesBuilder();
  initProcedureModal();
  initPhotoDropzone();
  initCoverPreviewModal();
  initPhoneMask();
  initSlugFormatter();
  initFormSubmission();
});

/* ── 0. Tela de Boas-Vindas / Onboarding Inicial ────────────────────────── */
function initWelcomeScreen() {
  const welcomeScreen = document.getElementById('welcome-screen');
  const btnStart = document.getElementById('btn-welcome-start');
  const btnLater = document.getElementById('btn-welcome-later');
  const stepsProgress = document.getElementById('steps-progress');
  const form = document.getElementById('onboarding-form');

  if (!welcomeScreen || !btnStart) return;

  const urlParams = new URLSearchParams(window.location.search);
  const isDirect = urlParams.get('direct') === '1' || urlParams.get('step') === '1' || window.location.pathname.startsWith('/formulario') || document.body.classList.contains('direct-form') || !welcomeScreen.classList.contains('is-active') || welcomeScreen.style.display === 'none';

  if (isDirect) {
    welcomeScreen.classList.remove('is-active');
    welcomeScreen.style.display = 'none';
    if (stepsProgress) stepsProgress.classList.remove('is-hidden');
    if (form) form.classList.remove('is-hidden');
    goToStep(1);
    return;
  }

  // Dispara a chuva de confetes de celebração ao abrir a tela de boas-vindas
  setTimeout(() => {
    launchCelebrationConfetti();
  }, 300);

  btnStart.addEventListener('click', () => {
    welcomeScreen.classList.remove('is-active');
    setTimeout(() => {
      welcomeScreen.style.display = 'none';
      if (stepsProgress) stepsProgress.classList.remove('is-hidden');
      if (form) form.classList.remove('is-hidden');
      goToStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 150);
  });

  const modalLater = document.getElementById('modal-later-preview');
  const btnCloseModalLater = document.getElementById('btn-close-modal-later');
  const btnOkModalLater = document.getElementById('btn-ok-modal-later');

  function openCustomModalLater() {
    if (!modalLater) return;
    modalLater.classList.remove('is-hidden');
    void modalLater.offsetWidth;
    modalLater.classList.add('is-active');
  }

  function closeCustomModalLater() {
    if (!modalLater) return;
    modalLater.classList.remove('is-active');
    setTimeout(() => {
      modalLater.classList.add('is-hidden');
    }, 300);
  }

  if (btnLater) {
    btnLater.addEventListener('click', openCustomModalLater);
  }
  if (btnCloseModalLater) btnCloseModalLater.addEventListener('click', closeCustomModalLater);
  if (btnOkModalLater) btnOkModalLater.addEventListener('click', closeCustomModalLater);
  if (modalLater) {
    modalLater.addEventListener('click', (e) => {
      if (e.target === modalLater) closeCustomModalLater();
    });
  }
}

function launchCelebrationConfetti() {
  if (typeof confetti !== 'function') return;

  const count = 180;
  const defaults = {
    origin: { y: 0.6 },
    colors: ['#e5a9b8', '#c04b6b', '#d4af37', '#f5ede6', '#ffffff', '#e8b4b8']
  };

  function fire(particleRatio, opts) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  }

  // Estouro inicial de celebração
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });

  // Chuva suave de 2.5 segundos nos cantos
  const duration = 2.5 * 1000;
  const animationEnd = Date.now() + duration;

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);
    
    const particleCount = 18 * (timeLeft / duration);
    confetti({
      particleCount,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ['#e5a9b8', '#d4af37', '#ffffff']
    });
    confetti({
      particleCount,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: ['#c04b6b', '#e5a9b8', '#f5ede6']
    });
  }, 250);
}

/* ── 1. Navegação Multi-Step com Validação ───────────────────────────────── */
let currentStep = 1;
const totalSteps = 4;

function initMultiStepNavigation() {
  const nextBtns = document.querySelectorAll('.btn-next-step');
  const prevBtns = document.querySelectorAll('.btn-prev-step');

  nextBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetStep = parseInt(btn.getAttribute('data-next'), 10);
      if (validateStep(currentStep)) {
        goToStep(targetStep);
      }
    });
  });

  prevBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetStep = parseInt(btn.getAttribute('data-prev'), 10);
      goToStep(targetStep);
    });
  });
}

function goToStep(stepNumber) {
  if (stepNumber < 1 || stepNumber > totalSteps) return;

  const previousStep = currentStep;
  const currentStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
  const targetStepEl = document.querySelector(`.form-step[data-step="${stepNumber}"]`);

  if (currentStepEl && targetStepEl) {
    currentStepEl.classList.remove('is-active');
    targetStepEl.classList.add('is-active');
    currentStep = stepNumber;

    updateProgressBar(currentStep);
    updateSummaryTags();

    if (window.LashAnalytics) {
      window.LashAnalytics.track('form_step_completed', {
        from_step: previousStep,
        to_step: stepNumber
      });
    }

    // Rola suavemente para o topo absoluto para exibir a barra de passos (1-2-3-4)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function updateProgressBar(step) {
  const progressBarFill = document.getElementById('progress-bar-fill');
  const nodes = document.querySelectorAll('.step-node');

  const percent = ((step) / totalSteps) * 100;
  if (progressBarFill) {
    progressBarFill.style.width = `${percent}%`;
  }

  nodes.forEach((node) => {
    const nodeStep = parseInt(node.getAttribute('data-step-node'), 10);
    node.classList.toggle('is-active', nodeStep === step);
    node.classList.toggle('is-completed', nodeStep < step);
  });
}

function validateStep(step) {
  const currentStepEl = document.querySelector(`.form-step[data-step="${step}"]`);
  if (!currentStepEl) return true;

  const requiredInputs = currentStepEl.querySelectorAll('input[required]');
  let isValid = true;

  requiredInputs.forEach((input) => {
    if (!input.value.trim()) {
      isValid = false;
      input.classList.add('is-invalid');
      input.focus();
      input.style.borderColor = '#dc2626';
      setTimeout(() => {
        input.style.borderColor = '';
      }, 3000);
    }
  });

  if (!isValid && window.LashAnalytics) {
    window.LashAnalytics.track('form_validation_error', {
      step: step
    });
  }

  return isValid;
}

/* ── 2. Seleção dos 3 Cards de Modelos & Cores (Opção 2) ─────────────────── */
let selectedModelId = 'glamour';
let selectedColorId = 'midnight';

function initModelCardsSelection() {
  const cards = document.querySelectorAll('.opt2-card');
  const hiddenModel = document.getElementById('input-selected-model');
  const hiddenColor = document.getElementById('input-selected-color');

  cards.forEach((card) => {
    const model = card.getAttribute('data-model');
    const pills = card.querySelectorAll('.opt2-pill');
    const iframe = card.querySelector('.opt2-iframe');
    const badge = card.querySelector('.opt2-phone-badge');
    const selectBtn = card.querySelector('.btn-select-model-card');

    // Troca de cor dentro do Card
    pills.forEach((pill) => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        pills.forEach((p) => p.classList.remove('is-active'));
        pill.classList.add('is-active');

        const color = pill.getAttribute('data-color');
        const label = pill.getAttribute('data-label');
        const url = pill.getAttribute('data-url');

        if (iframe) {
          const src = color === 'midnight' ? iframe.getAttribute('data-src-midnight') : iframe.getAttribute('data-src-rose');
          if (src) {
            iframe.style.opacity = '0.25';
            setTimeout(() => {
              iframe.src = src;
              iframe.style.opacity = '1';
            }, 100);
          }
        }

        if (badge && label) {
          badge.textContent = label;
        }

        // Atualiza o link de teste em tela cheia
        const testLink = card.querySelector('.opt2-test-link');
        if (testLink && url) {
          testLink.href = url;
        }

        // Seleciona automaticamente o card e salva a cor escolhida
        selectedColorId = color;
        if (hiddenColor) hiddenColor.value = color;
        selectCard(card);
      });
    });

    // Seleção do Card ao clicar no card ou no botão
    card.addEventListener('click', () => {
      selectCard(card);
    });

    if (selectBtn) {
      selectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectCard(card);
      });
    }
  });

  const modelButtonLabels = {
    glamour: 'Escolher Glamour',
    harmonia: 'Escolher Harmonia',
    classico: 'Escolher Clássico'
  };

  function selectCard(selectedCard) {
    cards.forEach((c) => {
      c.classList.remove('is-selected');
      const btn = c.querySelector('.btn-select-model-card .btn-select-text');
      const mId = c.getAttribute('data-model');
      if (btn) btn.textContent = modelButtonLabels[mId] || 'Escolher Modelo';
    });

    selectedCard.classList.add('is-selected');
    const activeBtn = selectedCard.querySelector('.btn-select-model-card .btn-select-text');
    if (activeBtn) activeBtn.textContent = '✓ Modelo Selecionado';

    selectedModelId = selectedCard.getAttribute('data-model');
    const activePill = selectedCard.querySelector('.opt2-pill.is-active');
    selectedColorId = activePill ? activePill.getAttribute('data-color') : 'midnight';

    if (hiddenModel) hiddenModel.value = selectedModelId;
    if (hiddenColor) hiddenColor.value = selectedColorId;

    updateSummaryTags();
  }
}

/* ── 3. Builder Dinâmico de Procedimentos & Fotos ────────────────────────── */
const defaultServices = [
  {
    name: 'Volume Brasileiro',
    price: '150,00',
    duration: '1h30',
    maintenance: '90,00 (até 20 dias)',
    cat: 'Extensão em Y',
    desc: 'Fios tecnológicos com formato Y que preenchem as falhas naturais com leveza incomparável, alta durabilidade e acabamento marcante.',
    effect: 'Preenchimento, Textura & Leveza',
    photo: '/modelos/glamour-midnight/assets/img/volume-brasileiro.png'
  },
  {
    name: 'Clássico Fio a Fio',
    price: '120,00',
    duration: '1h30',
    maintenance: '70,00 (até 18 dias)',
    cat: 'Fio a Fio Clássico',
    desc: 'Um fio sintético ultrafino acoplado a cada cílio natural saudável. O resultado mais elegante e discreto: olhar iluminado com efeito de rímel perfeito.',
    effect: 'Natural, Discreto & Elegante',
    photo: '/modelos/glamour-midnight/assets/img/classico-fio-a-fio.png'
  },
  {
    name: 'Volume Egípcio',
    price: '160,00',
    duration: '1h30',
    maintenance: '95,00 (até 20 dias)',
    cat: 'Extensão em W',
    desc: 'Fios especiais em formato W (3D tecnológico) que proporcionam densidade homogênea, efeito aveludado e volume equilibrado sem pesar nos olhos.',
    effect: 'Densidade Aveludada & Uniforme',
    photo: '/modelos/glamour-midnight/assets/img/volume-egipcio.png'
  },
  {
    name: 'Volume Híbrido',
    price: '160,00',
    duration: '1h45',
    maintenance: '95,00 (até 20 dias)',
    cat: 'Clássico + Volume',
    desc: 'A combinação artesanal entre a delicadeza do fio a fio clássico e leques de volume, criando textura multidimensional, profundidade e brilho no olhar.',
    effect: 'Textura Desconstruída & Volume Sob Medida',
    photo: '/modelos/glamour-midnight/assets/img/volume-hibrido.png'
  },
  {
    name: 'Volume Russo',
    price: '190,00',
    duration: '2h00',
    maintenance: '110,00 (até 20 dias)',
    cat: 'Fans Artesanais 3D–6D',
    desc: 'Técnica de alta precisão com fans ultrafinos (3 a 6 fios de seda) montados à mão na hora. Cria um volume expressivo, extremamente macio, denso e sofisticado.',
    effect: 'Glamour, Densidade & Toque de Pluma',
    photo: '/modelos/glamour-midnight/assets/img/volume-russo.png'
  },
  {
    name: 'Mega Volume',
    price: '240,00',
    duration: '2h30',
    maintenance: '140,00 (até 18 dias)',
    cat: 'Densidade Máxima 8D–12D',
    desc: 'O ápice da densidade e do impacto visual: leques artesanais com fios ultrafinos de 0.03mm. Proporciona um olhar super pretinho, aveludado e hipnotizante.',
    effect: 'Impacto Máximo, Densidade Total & Preto Profundo',
    photo: '/modelos/glamour-midnight/assets/img/mega-volume.png'
  },
  {
    name: 'Fox Eyes',
    price: '170,00',
    duration: '1h45',
    maintenance: '100,00 (até 20 dias)',
    cat: 'Mapping Estilizado',
    desc: 'Alongamento estratégico com curvaturas graduais no canto externo. Cria um efeito delineado sofisticado que eleva o olhar sem necessidade de maquiagem.',
    effect: 'Olhar Delineado, Marcante & Elevação',
    photo: '/modelos/glamour-midnight/assets/img/fox-eyes.png'
  },
  {
    name: 'Lash Lifting',
    price: '130,00',
    duration: '1h00',
    maintenance: 'Incluso',
    cat: 'Tratamento Natural',
    desc: 'Curvatura e hidratação profunda dos próprios cílios naturais com tintura e queratina botox. Sem fios artificiais, durabilidade de até 6 a 8 semanas.',
    effect: 'Cílios Curvados, Pretos e Nutridos',
    photo: '/modelos/glamour-midnight/assets/img/lash-lifting.png'
  },
  {
    name: 'Mapping Boneca / Gatinho',
    price: 'Incluso',
    duration: 'Design',
    maintenance: '-',
    cat: 'Personalização de Olhar',
    desc: 'Consultoria de visagismo personalizada para definir o desenho ideal dos fios de acordo com o formato e proporção única dos olhos da cliente.',
    effect: 'Harmonização do Olhar',
    photo: '/modelos/glamour-midnight/assets/img/mapping-boneca.png'
  },
  {
    name: 'Remoção dos Fios',
    price: '50,00',
    duration: '40min',
    maintenance: '-',
    cat: 'Remoção Segura',
    desc: 'Remoção com produto profissional dermatologicamente testado em creme/gel, preservando 100% da integridade e saúde dos cílios naturais.',
    effect: 'Desacoplamento Suave Sem Danos',
    photo: '/modelos/glamour-midnight/assets/img/remocao.png'
  }
];

function updateServicesCount() {
  const container = document.getElementById('services-builder');
  const countDisplay = document.getElementById('services-count-number');
  if (container && countDisplay) {
    const total = container.querySelectorAll('.service-row-card').length;
    countDisplay.textContent = total;
  }
}

function initServicesBuilder() {
  const container = document.getElementById('services-builder');
  const addBtn = document.getElementById('btn-add-service');
  if (!container || !addBtn) return;

  // Carrega procedimentos oficiais do catálogo
  defaultServices.forEach((svc) => renderServiceRow(container, svc));

  // Botão Adicionar Mais Procedimento
  addBtn.addEventListener('click', () => {
    renderServiceRow(container, {
      name: '',
      price: '',
      duration: '',
      maintenance: '',
      cat: 'Procedimento Personalizado',
      desc: '',
      effect: '',
      photo: '/modelos/glamour-midnight/assets/img/volume-brasileiro.png'
    });
  });
}

function renderServiceRow(container, data) {
  const row = document.createElement('div');
  row.className = 'service-row-card';

  const defaultPhoto = data.photo || '/modelos/glamour-midnight/assets/img/volume-brasileiro.png';

  row.innerHTML = `
    <!-- Topo: Nome do Procedimento + Botão Lixeira -->
    <div class="service-card-header">
      <div class="service-mini-field service-name-field">
        <label class="sm-label">Nome do Procedimento</label>
        <input type="text" class="sm-input service-name" placeholder="Ex: Volume Brasileiro" value="${data.name || ''}" required>
      </div>
      <button type="button" class="btn-remove-service" title="Remover este procedimento" aria-label="Remover procedimento">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
      </button>
    </div>

    <!-- Valores: Valor, Duração e Manutenção -->
    <div class="service-values-grid">
      <div class="service-mini-field">
        <label class="sm-label">Valor (R$)</label>
        <input type="text" class="sm-input service-price" placeholder="150,00" value="${data.price || ''}">
      </div>
      <div class="service-mini-field">
        <label class="sm-label">Duração</label>
        <input type="text" class="sm-input service-duration" placeholder="1h30" value="${data.duration || ''}">
      </div>
      <div class="service-mini-field">
        <label class="sm-label">Manutenção</label>
        <input type="text" class="sm-input service-maintenance" placeholder="90,00" value="${data.maintenance || ''}">
      </div>
    </div>

    <!-- Botão de Expandir Detalhes Avançados (Colapsado) -->
    <div class="service-advanced-toggle-wrap">
      <button type="button" class="btn-toggle-advanced">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
        <span>Personalizar Descrição &amp; Efeitos (Opcional)</span>
      </button>
    </div>

    <!-- Gaveta de Campos Avançados (Colapsada de início) -->
    <div class="service-advanced-drawer" style="display: none;">
      <div class="service-mini-field">
        <label class="sm-label">Descrição Persuasiva do Procedimento</label>
        <textarea class="sm-input service-desc" rows="2" placeholder="Descreva os benefícios e o visual da técnica...">${data.desc || ''}</textarea>
      </div>
      <div class="service-advanced-grid">
        <div class="service-mini-field">
          <label class="sm-label">Efeito Visual</label>
          <input type="text" class="sm-input service-effect" placeholder="Ex: Preenchimento, Textura & Leveza" value="${data.effect || ''}">
        </div>
      </div>
      <div class="service-mini-field">
        <label class="sm-label">Categoria / Técnica</label>
        <input type="text" class="sm-input service-cat" placeholder="Ex: Extensão em Y" value="${data.cat || 'Extensão de Cílios'}">
      </div>
    </div>

    <!-- Base: Barra de Foto com Prévia e Troca -->
    <div class="service-photo-bar">
      <div class="service-photo-thumb-wrap" title="Ver prévia deste procedimento">
        <img src="${defaultPhoto}" alt="Foto ${data.name || 'Procedimento'}" class="service-photo-thumb">
      </div>
      <div class="service-photo-info">
        <span class="service-photo-status">Foto do Procedimento</span>
        <span class="service-photo-hint">Foto oficial ou personalizada</span>
      </div>
      <div class="service-photo-actions">
        <button type="button" class="btn-proc-preview" title="Ver como fica no catálogo">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          <span>Ver Prévia</span>
        </button>
        <button type="button" class="btn-change-photo-mini" title="Trocar foto">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          <span>Trocar</span>
        </button>
      </div>
      <input type="file" accept="image/*" class="service-file-input">
    </div>
  `;

  const thumbWrap = row.querySelector('.service-photo-thumb-wrap');
  const previewBtn = row.querySelector('.btn-proc-preview');
  const changeBtn = row.querySelector('.btn-change-photo-mini');
  const fileInput = row.querySelector('.service-file-input');
  const photoThumb = row.querySelector('.service-photo-thumb');
  const photoStatus = row.querySelector('.service-photo-status');
  const photoHint = row.querySelector('.service-photo-hint');
  const toggleAdvBtn = row.querySelector('.btn-toggle-advanced');
  const advDrawer = row.querySelector('.service-advanced-drawer');

  // Alterna gaveta de detalhes avançados
  if (toggleAdvBtn && advDrawer) {
    toggleAdvBtn.addEventListener('click', () => {
      const isCurrentlyHidden = advDrawer.style.display === 'none' || !advDrawer.classList.contains('is-open');
      if (isCurrentlyHidden) {
        advDrawer.style.display = 'flex';
        advDrawer.classList.add('is-open');
        toggleAdvBtn.classList.add('is-active');
        toggleAdvBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg><span>Fechar Detalhes Avançados</span>`;
      } else {
        advDrawer.style.display = 'none';
        advDrawer.classList.remove('is-open');
        toggleAdvBtn.classList.remove('is-active');
        toggleAdvBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg><span>Personalizar Descrição &amp; Efeitos (Opcional)</span>`;
      }
    });
  }

  // Abre Prévia
  const openPreview = (e) => {
    e.stopPropagation();
    openProcedureModal(row);
  };
  thumbWrap.addEventListener('click', openPreview);
  previewBtn.addEventListener('click', openPreview);

  // Troca de Foto
  changeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      row._customPhotoFile = file; // Arquivo original para upload no Supabase
      const reader = new FileReader();
      reader.onload = (evt) => {
        photoThumb.src = evt.target.result;
        row.setAttribute('data-has-custom-photo', 'true');

        if (photoStatus) {
          photoStatus.innerHTML = '✓ Foto Própria Aplicada';
          photoStatus.classList.add('is-custom');
        }
        if (photoHint) {
          photoHint.textContent = 'Foto personalizada carregada com sucesso';
        }

        // Se o modal estiver aberto para este card, atualiza a imagem no modal também
        const modalImg = document.getElementById('proc-modal-img');
        if (modalImg && currentModalRow === row) {
          modalImg.src = evt.target.result;
        }
      };
      reader.readAsDataURL(file);
    }
  });

  // Remoção com Lixeira
  row.querySelector('.btn-remove-service').addEventListener('click', () => {
    const allRows = container.querySelectorAll('.service-row-card');
    if (allRows.length > 1) {
      row.remove();
      updateServicesCount();
      updateSummaryTags();
    } else {
      alert('Você precisa ter pelo menos 1 procedimento no seu catálogo.');
    }
  });

  container.appendChild(row);
  updateServicesCount();
}

/* ── 3.1 Modal de Prévia do Procedimento (Catálogo) ─────────────────────── */
let currentModalRow = null;

function initProcedureModal() {
  const modal = document.getElementById('proc-preview-modal');
  const backdrop = document.getElementById('proc-preview-backdrop');
  const closeBtn = document.getElementById('proc-preview-close');
  const changePhotoBtn = document.getElementById('proc-modal-change-photo-btn');

  if (!modal) return;

  const closeModal = () => {
    modal.classList.add('is-hidden');
    modal.setAttribute('aria-hidden', 'true');
    currentModalRow = null;
  };

  if (backdrop) backdrop.addEventListener('click', closeModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  if (changePhotoBtn) {
    changePhotoBtn.addEventListener('click', () => {
      if (currentModalRow) {
        const fileInput = currentModalRow.querySelector('.service-file-input');
        if (fileInput) fileInput.click();
      }
    });
  }

  // Fecha com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('is-hidden')) {
      closeModal();
    }
  });
}

function openProcedureModal(row) {
  const modal = document.getElementById('proc-preview-modal');
  if (!modal || !row) return;

  currentModalRow = row;

  // Obtém modelo e paleta selecionados na Etapa 2
  const currentModel = document.getElementById('input-selected-model')?.value || selectedModelId || 'glamour';
  const currentColor = document.getElementById('input-selected-color')?.value || selectedColorId || 'midnight';

  const sheet = modal.querySelector('.proc-preview-sheet');
  if (sheet) {
    sheet.setAttribute('data-theme-model', currentModel);
    sheet.setAttribute('data-theme-color', currentColor);
  }

  const modelLabels = {
    glamour: '✨ Glamour',
    harmonia: '🌸 Harmonia',
    classico: '👑 Clássico'
  };

  const badgeEl = modal.querySelector('.proc-preview-badge');
  if (badgeEl) {
    badgeEl.textContent = `${modelLabels[currentModel] || '✨ Catálogo'} · Prévia`;
  }

  const nameVal = row.querySelector('.service-name')?.value || 'Procedimento';
  const priceVal = row.querySelector('.service-price')?.value;
  const durationVal = row.querySelector('.service-duration')?.value;
  const maintenanceVal = row.querySelector('.service-maintenance')?.value;
  const catVal = row.querySelector('.service-cat')?.value || 'Extensão de Cílios';
  const descVal = row.querySelector('.service-desc')?.value || 'Procedimento profissional de embelezamento e realce do olhar.';
  const effectVal = row.querySelector('.service-effect')?.value || 'Realce e Sofisticação do Olhar';
  const photoSrc = row.querySelector('.service-photo-thumb')?.src || '';

  const modalImg = document.getElementById('proc-modal-img');
  const modalCat = document.getElementById('proc-modal-cat');
  const modalTitle = document.getElementById('proc-modal-title');
  const modalDesc = document.getElementById('proc-modal-desc');
  const modalPrice = document.getElementById('proc-modal-price');
  const modalMaintenance = document.getElementById('proc-modal-maintenance');
  const modalDuration = document.getElementById('proc-modal-duration');
  const modalEffect = document.getElementById('proc-modal-effect');

  if (modalImg) modalImg.src = photoSrc;
  if (modalCat) modalCat.textContent = catVal.toUpperCase();
  if (modalTitle) modalTitle.textContent = nameVal.trim() || 'Procedimento';
  if (modalDesc) modalDesc.textContent = descVal;
  if (modalPrice) modalPrice.textContent = priceVal ? (priceVal.startsWith('R$') ? priceVal : `R$ ${priceVal}`) : 'R$ 150,00';
  if (modalMaintenance) modalMaintenance.textContent = maintenanceVal ? (maintenanceVal.startsWith('R$') || maintenanceVal === '-' || maintenanceVal === 'Incluso' ? maintenanceVal : `R$ ${maintenanceVal}`) : '-';
  if (modalDuration) modalDuration.textContent = durationVal || '1h30';
  if (modalEffect) modalEffect.textContent = effectVal;

  modal.classList.remove('is-hidden');
  modal.setAttribute('aria-hidden', 'false');
}

/* ── 4. Dropzone & Upload de Foto ou Vídeo de Capa ───────────────────────── */
let uploadedCoverFile = null;

function initPhotoDropzone() {
  const dropzone = document.getElementById('avatar-dropzone');
  const fileInput = document.getElementById('input-avatar-file');
  const dropzoneEmpty = document.getElementById('dropzone-empty');
  const dropzonePreview = document.getElementById('dropzone-preview');
  const previewImg = document.getElementById('avatar-preview-img');
  const previewVideo = document.getElementById('avatar-preview-video');
  const removeBtn = document.getElementById('btn-remove-avatar');

  if (!dropzone || !fileInput) return;

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadedCoverFile = file; // Arquivo original da Capa para upload no Supabase
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();

      reader.onload = (event) => {
        if (isVideo) {
          if (previewImg) previewImg.classList.add('is-hidden');
          if (previewVideo) {
            previewVideo.src = event.target.result;
            previewVideo.classList.remove('is-hidden');
            previewVideo.play().catch(() => {});
          }
        } else {
          if (previewVideo) {
            previewVideo.pause();
            previewVideo.src = '';
            previewVideo.classList.add('is-hidden');
          }
          if (previewImg) {
            previewImg.src = event.target.result;
            previewImg.classList.remove('is-hidden');
          }
        }

        dropzoneEmpty.classList.add('is-hidden');
        dropzonePreview.classList.remove('is-hidden');
      };

      reader.readAsDataURL(file);
    }
  });

  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      uploadedCoverFile = null;
      fileInput.value = '';
      if (previewImg) {
        previewImg.src = '';
        previewImg.classList.add('is-hidden');
      }
      if (previewVideo) {
        previewVideo.pause();
        previewVideo.src = '';
        previewVideo.classList.add('is-hidden');
      }
      dropzonePreview.classList.add('is-hidden');
      dropzoneEmpty.classList.remove('is-hidden');
    });
  }
}

/* ── 4.1 Modal de Prévia da Capa Oficial (Hero 9:16) ────────────────────── */
function initCoverPreviewModal() {
  const openBtn = document.getElementById('btn-open-cover-preview');
  const modal = document.getElementById('cover-preview-modal');
  const backdrop = document.getElementById('cover-preview-backdrop');
  const closeBtn = document.getElementById('cover-preview-close');
  const phone = document.getElementById('cover-preview-phone');

  if (!modal) return;

  const closeModal = () => {
    modal.classList.add('is-hidden');
    modal.setAttribute('aria-hidden', 'true');
    const video = document.getElementById('cover-modal-video');
    if (video) video.pause();
  };

  if (backdrop) backdrop.addEventListener('click', closeModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('is-hidden')) {
      closeModal();
    }
  });

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      // 1. Dados dinâmicos do formulário
      const designerName = document.getElementById('input-designer-name')?.value?.trim() || 'Mariana Alves';
      const heroPhrase = document.getElementById('input-hero-phrase')?.value?.trim() || 'Especialista em extensão de cílios e visagismo do olhar.';
      const currentModel = document.getElementById('input-selected-model')?.value || selectedModelId || 'glamour';
      const currentColor = document.getElementById('input-selected-color')?.value || selectedColorId || 'midnight';

      // 2. Elementos da interface do modal
      const modalName = document.getElementById('cover-modal-name');
      const modalPhrase = document.getElementById('cover-modal-phrase');
      const modalImg = document.getElementById('cover-modal-img');
      const modalVideo = document.getElementById('cover-modal-video');

      if (modalName) modalName.textContent = designerName;
      if (modalPhrase) modalPhrase.textContent = heroPhrase;

      if (phone) {
        phone.setAttribute('data-theme-model', currentModel);
        phone.setAttribute('data-theme-color', currentColor);
      }

      // 3. Mídia: Foto ou Vídeo enviado pelo usuário ou Padrão do Modelo
      const uploadedImg = document.getElementById('avatar-preview-img');
      const uploadedVideo = document.getElementById('avatar-preview-video');

      if (uploadedVideo && !uploadedVideo.classList.contains('is-hidden') && uploadedVideo.src) {
        if (modalImg) modalImg.classList.add('is-hidden');
        if (modalVideo) {
          modalVideo.src = uploadedVideo.src;
          modalVideo.classList.remove('is-hidden');
          modalVideo.play().catch(() => {});
        }
      } else if (uploadedImg && !uploadedImg.classList.contains('is-hidden') && uploadedImg.src) {
        if (modalVideo) {
          modalVideo.pause();
          modalVideo.classList.add('is-hidden');
        }
        if (modalImg) {
          modalImg.src = uploadedImg.src;
          modalImg.classList.remove('is-hidden');
        }
      } else {
        // Mídia de demonstração oficial de alta qualidade
        if (modalVideo) {
          modalVideo.pause();
          modalVideo.classList.add('is-hidden');
        }
        if (modalImg) {
          modalImg.src = currentColor === 'rose'
            ? '/modelos/harmonia-rose/assets/img/hero-video-poster.jpg'
            : '/modelos/glamour-midnight/assets/img/hero-video-poster.jpg';
          modalImg.classList.remove('is-hidden');
        }
      }

      modal.classList.remove('is-hidden');
      modal.setAttribute('aria-hidden', 'false');
    });
  }
}

/* ── 5. Máscara de Telefone (WhatsApp) ──────────────────────────────────── */
function initPhoneMask() {
  const phoneInput = document.getElementById('input-whatsapp');
  if (!phoneInput) return;

  phoneInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 10) {
      e.target.value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (value.length > 6) {
      e.target.value = value.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
    } else if (value.length > 2) {
      e.target.value = value.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
    } else if (value.length > 0) {
      e.target.value = `(${value}`;
    }
  });
}

/* ── 6. Formatador de Subdomínio (Slug) ─────────────────────────────────── */
function initSlugFormatter() {
  const nameInput = document.getElementById('input-designer-name');
  const slugInput = document.getElementById('input-slug');
  if (!slugInput) return;

  if (nameInput) {
    nameInput.addEventListener('blur', () => {
      if (!slugInput.value.trim() && nameInput.value.trim()) {
        const firstWord = nameInput.value.trim().split(' ')[0];
        slugInput.value = formatSlug(firstWord);
      }
    });
  }

  slugInput.addEventListener('input', (e) => {
    e.target.value = formatSlug(e.target.value);
  });
}

function initSlugFormatter() {
  const nameInput = document.getElementById('input-designer-name');
  const slugInput = document.getElementById('input-slug');
  if (!slugInput) return;

  let userHasEditedSlugManually = false;

  slugInput.addEventListener('input', () => {
    userHasEditedSlugManually = true;
    slugInput.value = formatSlugNoHyphen(slugInput.value);
  });

  if (nameInput) {
    nameInput.addEventListener('input', () => {
      if (userHasEditedSlugManually) return;
      const raw = nameInput.value.trim();
      if (!raw) {
        slugInput.value = '';
        return;
      }
      const parts = raw.split(/\s+/).filter(Boolean);
      let combined = '';
      if (parts.length >= 2) {
        combined = parts[0] + parts[1]; // Nome + primeiro sobrenome junto
      } else {
        combined = parts[0];
      }
      slugInput.value = formatSlugNoHyphen(combined);
    });
  }
}

function formatSlugNoHyphen(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/* ── 7. Atualização das Tags de Resumo na Etapa 4 ───────────────────────── */
function updateSummaryTags() {
  const nameVal = document.getElementById('input-designer-name')?.value || 'Sua Marca';
  const selectedModel = document.getElementById('input-selected-model')?.value || selectedModelId;
  const selectedColor = document.getElementById('input-selected-color')?.value || selectedColorId;
  const servicesCount = document.querySelectorAll('.service-row-card').length;

  const modelMap = { glamour: '✨ Modelo Glamour', harmonia: '🌸 Modelo Harmonia', classico: '👑 Modelo Clássico' };
  const colorMap = { midnight: '🖤 Midnight', rose: '🎀 Rosé' };

  const sumName = document.getElementById('sum-name');
  const sumModel = document.getElementById('sum-model');
  const sumColor = document.getElementById('sum-color');
  const sumServices = document.getElementById('sum-services');

  if (sumName) sumName.textContent = nameVal.trim() || 'Lash Designer';
  if (sumModel) sumModel.textContent = modelMap[selectedModel] || 'Modelo Glamour';
  if (sumColor) sumColor.textContent = colorMap[selectedColor] || 'Midnight';
  if (sumServices) sumServices.textContent = `${servicesCount} Procedimentos`;
}

/* ── 8. Envio do Formulário & Integração Supabase ──────────────────────── */
function initFormSubmission() {
  const form = document.getElementById('onboarding-form');
  const successScreen = document.getElementById('success-screen');
  const successLinkDisplay = document.getElementById('success-link-display');
  const whatsappConfirmBtn = document.getElementById('btn-whatsapp-confirm');
  const submitBtn = document.getElementById('btn-submit-final');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Salvando &amp; Gerando Catálogo...</span> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;
    }

    const designerName = document.getElementById('input-designer-name')?.value || 'Lash Designer';
    const whatsapp = document.getElementById('input-whatsapp')?.value || '';
    const instagram = document.getElementById('input-instagram')?.value || '';
    const location = document.getElementById('input-location')?.value || '';
    const rawSlug = document.getElementById('input-slug')?.value || 'catalogo';
    const slug = rawSlug.toLowerCase().replace(/[^a-z0-9]/g, '') || 'catalogo';

    const selectedModel = document.getElementById('input-selected-model')?.value || (typeof selectedModelId !== 'undefined' ? selectedModelId : 'glamour');
    const selectedColor = document.getElementById('input-selected-color')?.value || (typeof selectedColorId !== 'undefined' ? selectedColorId : 'rose');
    const heroPhrase = document.getElementById('input-hero-phrase')?.value || '';

    // Captura parâmetros da URL do checkout (se houver)
    const urlParams = new URLSearchParams(window.location.search);
    const platformOrderId = urlParams.get('order_id') || urlParams.get('id') || '';
    const clientEmail = urlParams.get('email') || '';

    // Preenche dados da tela de sucesso imediatamente
    if (successLinkDisplay) {
      successLinkDisplay.textContent = `${slug}.lashmenu.com`;
    }

    const designerNameEl = document.getElementById('success-designer-name');
    if (designerNameEl) {
      designerNameEl.textContent = `Designer: ${designerName}`;
    }

    const summaryModelEl = document.getElementById('success-summary-model');
    if (summaryModelEl) {
      summaryModelEl.textContent = `Layout ${selectedModel.toString().toUpperCase()} · ${selectedColor.toString().toUpperCase()}`;
    }

    // Coleta dados dos serviços antes da transição da UI
    const serviceRows = document.querySelectorAll('.service-row-card');
    const serviceRowsData = [];

    for (let i = 0; i < serviceRows.length; i++) {
      const row = serviceRows[i];
      const name = row.querySelector('.service-name')?.value || '';
      const price = row.querySelector('.service-price')?.value || '';
      const duration = row.querySelector('.service-duration')?.value || '';
      const maintenance = row.querySelector('.service-maintenance')?.value || '';
      const cat = row.querySelector('.service-cat')?.value || 'Extensão de Cílios';
      const desc = row.querySelector('.service-desc')?.value || '';
      const effect = row.querySelector('.service-effect')?.value || '';
      const recommendation = row.querySelector('.service-recommendation')?.value || '';
      const isCustom = row.getAttribute('data-has-custom-photo') === 'true';
      const defaultPhotoUrl = row.querySelector('.service-photo-thumb')?.src || '';

      if (name.trim()) {
        serviceRowsData.push({
          name: name.trim(),
          price: price.trim(),
          duration: duration.trim(),
          maintenance: maintenance.trim(),
          category: cat.trim(),
          description: desc.trim(),
          effect: effect.trim(),
          recommendation: recommendation.trim(),
          defaultPhotoUrl: defaultPhotoUrl,
          customFile: row._customPhotoFile || null,
          isCustom: isCustom
        });
      }
    }

    // Dispara a notificação no Telegram (Backend Vercel Serverless + Image Ping com referência na window)
    let hasSentTelegram = false;
    const sendTelegramNotice = (orderId = null, finalSlug = slug) => {
      if (hasSentTelegram) return;
      hasSentTelegram = true;

      try {
        const TELEGRAM_BOT_TOKEN = '8665382415:AAHI93Z9SppDujl-02jyDpPvZ7EEow0zJ8E';
        const TELEGRAM_CHAT_ID = '1874074109';
        const nowStr = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

        const adminEditorUrl = orderId 
          ? `https://lashmenu.com/admin/editor.html?id=${orderId}`
          : `https://lashmenu.com/admin/`;

        const safeModel = (selectedModel || 'glamour').toString().toUpperCase();
        const safeColor = (selectedColor || 'rose').toString().toUpperCase();
        const cleanInsta = instagram ? instagram.toString().replace(/^@/, '').trim() : 'Não informado';

        const payload = {
          designerName,
          clientEmail,
          whatsapp,
          instagram: cleanInsta,
          selectedModel: safeModel,
          selectedColor: safeColor,
          slug: finalSlug,
          orderId
        };

        // 1. Envio seguro via Backend Serverless Vercel (/api/telegram)
        fetch('/api/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(err => console.warn('Aviso API Backend Telegram:', err));

        // 2. Disparo por Image Ping com ancoragem no objeto window para evitar Garbage Collection do JS
        const tgMessage = `🎉 Nova profissional cadastrada!\n\n` +
          `👤 ${designerName}\n` +
          `✉️ ${clientEmail || 'Não informado'}\n` +
          `📱 ${whatsapp || 'Não informado'}\n` +
          `📸 @${cleanInsta}\n` +
          `🎨 Layout ${safeModel} · ${safeColor}\n` +
          `🔗 https://${finalSlug}.lashmenu.com\n` +
          `🕒 ${nowStr}\n\n` +
          `⚡ Clique para Aprovar no Painel:\n` +
          `${adminEditorUrl}`;

        const getUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${encodeURIComponent(tgMessage)}`;
        
        window._tgPing = new Image();
        window._tgPing.src = getUrl;
      } catch (tgEx) {
        console.warn('Erro ao disparar Telegram:', tgEx);
      }
    };

    // Disparo imediato do aviso para o administrador
    sendTelegramNotice(null, slug);

    // Rastrear conversão concluída e identificar usuário no PostHog
    if (window.LashAnalytics) {
      window.LashAnalytics.track('form_submitted', {
        designer_name: designerName,
        whatsapp: whatsapp,
        instagram: instagram,
        selected_model: selectedModel,
        selected_color: selectedColor,
        slug: slug,
        services_count: serviceRowsData.length
      });

      const userIdentifier = clientEmail || whatsapp || slug;
      window.LashAnalytics.identify(userIdentifier, {
        name: designerName,
        whatsapp: whatsapp,
        instagram: instagram,
        slug: slug,
        model: selectedModel,
        color: selectedColor
      });
    }

    // Transição Instantânea da UI em 1.2s para a Tela de Sucesso
    setTimeout(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }

      form.style.display = 'none';
      const progressTrack = document.querySelector('.steps-progress');
      if (progressTrack) progressTrack.style.display = 'none';

      if (successScreen) {
        successScreen.classList.remove('is-hidden');
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Dispara os confetes de comemoração
      try {
        if (typeof launchCelebrationConfetti === 'function') {
          launchCelebrationConfetti();
        }
      } catch(e){}
    }, 1200);

    // Processamento de Uploads e Banco de Dados em Background (Assíncrono em Paralelo)
    (async function processBackgroundPersistence() {
      try {
        const finalSlug = window.lashSupabase ? await window.lashSupabase.ensureUniqueSlug(rawSlug) : slug;

        if (successLinkDisplay) {
          successLinkDisplay.textContent = `${finalSlug}.lashmenu.com`;
        }

        // 1. Upload da Capa com Otimização Automática
        let coverMediaUrl = null;
        let coverMediaType = 'image';

        if (uploadedCoverFile && window.lashSupabase) {
          try {
            const isVideo = uploadedCoverFile.type.startsWith('video/');
            coverMediaType = isVideo ? 'video' : 'image';

            let fileToUpload = uploadedCoverFile;
            if (!isVideo && typeof window.compressImageFile === 'function') {
              fileToUpload = await window.compressImageFile(uploadedCoverFile, { maxDimension: 1200, quality: 0.82 });
            }

            const fileExt = fileToUpload.name ? fileToUpload.name.split('.').pop() : (isVideo ? 'mp4' : 'webp');
            const coverPath = `covers/${finalSlug}-cover-${Date.now()}.${fileExt}`;

            coverMediaUrl = await window.lashSupabase.uploadFile('catalog-assets', coverPath, fileToUpload);
          } catch (errCover) {
            console.warn('Aviso no upload da capa:', errCover);
          }
        }

        // 2. Upload de Fotos de Serviços em PARALELO com Compressão Automática
        const uploadPromises = serviceRowsData.map(async (svc, i) => {
          let finalPhotoUrl = svc.defaultPhotoUrl;
          if (svc.customFile && window.lashSupabase) {
            try {
              let fileToUpload = svc.customFile;
              if (typeof window.compressImageFile === 'function') {
                fileToUpload = await window.compressImageFile(svc.customFile, { maxDimension: 800, quality: 0.82 });
              }
              const fileExt = fileToUpload.name ? fileToUpload.name.split('.').pop() : 'webp';
              const svcPath = `services/${finalSlug}-proc-${i + 1}-${Date.now()}.${fileExt}`;
              finalPhotoUrl = await window.lashSupabase.uploadFile('catalog-assets', svcPath, fileToUpload);
            } catch (errSvc) {
              console.warn('Erro no upload de foto de serviço:', errSvc);
            }
          }
          return {
            name: svc.name,
            price: svc.price,
            duration: svc.duration,
            maintenance: svc.maintenance,
            category: svc.category,
            description: svc.description,
            effect: svc.effect,
            recommendation: svc.recommendation,
            photo_url: finalPhotoUrl,
            is_custom_photo: svc.isCustom
          };
        });

        const processedServices = await Promise.all(uploadPromises);

        // 3. Persistência no Banco Supabase
        if (window.lashSupabase) {
          const orderRecord = {
            platform_order_id: platformOrderId || null,
            client_email: clientEmail || null,
            client_name: designerName,
            whatsapp: whatsapp,
            instagram: instagram,
            location: location,
            slug: finalSlug,
            model_id: selectedModel,
            color_id: selectedColor,
            hero_phrase: heroPhrase,
            cover_media_url: coverMediaUrl,
            cover_media_type: coverMediaType,
            status: 'pendente_revisao',
            published_url: `https://${finalSlug}.lashmenu.com`
          };

          const insertedOrder = await window.lashSupabase.insert('orders', orderRecord);
          const orderId = insertedOrder ? (insertedOrder.id || (Array.isArray(insertedOrder) && insertedOrder[0]?.id)) : null;

          if (orderId) {
            const servicesRecords = processedServices.map((svc, idx) => ({
              order_id: orderId,
              name: svc.name,
              price: svc.price,
              duration: svc.duration,
              maintenance: svc.maintenance,
              category: svc.category,
              description: svc.description,
              effect: svc.effect,
              recommendation: svc.recommendation,
              photo_url: svc.photo_url,
              is_custom_photo: svc.is_custom_photo,
              order_index: idx + 1
            }));

            await window.lashSupabase.insert('order_services', servicesRecords);

            // Notifica o admin no Telegram com o link exato do painel editor
            sendTelegramNotice(orderId, finalSlug);
          }
        }
      } catch (bgErr) {
        console.warn('Erro no processamento em background:', bgErr);
      }
    })();
  });
}

window.handleConfirmDone = function() {
  const btn = document.getElementById('btn-confirm-done');
  if (btn) {
    btn.classList.add('is-confirmed');
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg> <span>Perfeito! Pode fechar esta aba com tranquilidade ✨</span>`;
    btn.disabled = true;
  }
};
