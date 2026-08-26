/* ==========================================================================
   LASHMENU — SCRIPTS DE INTERAÇÃO E ANIMAÇÕES
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initHeroPhoneScaler();
  initHeaderScroll();
  initScrollReveal();
  initCounters();
  initFaqAccordion();
  initStyleTabs();
  initSmoothScroll();
  initMockupSlider();
  initModelsShowroom();
  initLashAnalyticsLPB();
  initTestDriveModal();
});

/* ── 1. Header Scroll Effect ─────────────────────────────────────────────── */
function initHeaderScroll() {
  const header = document.querySelector('.header-nav');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 40) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/* ── 2. Scroll Reveal Animations ─────────────────────────────────────────── */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  reveals.forEach((el) => observer.observe(el));
}

/* ── 3. Animated Counters ────────────────────────────────────────────────── */
function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const animateCount = (el) => {
    const target = parseInt(el.getAttribute('data-counter'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    const duration = 1200;
    const startTime = performance.now();

    const updateCount = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(eased * target);

      el.textContent = `${prefix}${currentVal}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        el.textContent = `${prefix}${target}${suffix}`;
      }
    };

    requestAnimationFrame(updateCount);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  counters.forEach((el) => observer.observe(el));
}

/* ── 4. Mockup Live Preview & Visibility Controller ────────────────────── */
function initMockupSlider() {
  const nameLabel = document.getElementById('preview-screen-name');
  const iframe = document.getElementById('vitrine-preview-frame');
  const mockupWrapper = document.querySelector('.hero-mockup-wrapper');

  // Atualiza label do badge superior da tela
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'VITRINE_SCREEN_CHANGE') {
      const labelMap = {
        'Hero': 'Capa Oficial',
        'Procedimentos': 'Procedimentos & Valores',
        'Manutenção e Cuidados': 'Manutenção & Cuidados',
        'Agendamento': 'Orientações & Agendamento',
        'Contato': 'Contato & WhatsApp'
      };
      if (nameLabel) {
        nameLabel.textContent = labelMap[event.data.label] || event.data.label || 'Catálogo ao vivo';
      }
    }
  });

  if (!iframe || !mockupWrapper) return;

  // Dispara o tour apenas quando o celular estiver no campo de visão e reseta ao sair
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      try {
        if (entry.isIntersecting) {
          iframe.contentWindow?.postMessage({ type: 'START_TOUR' }, '*');
        } else {
          iframe.contentWindow?.postMessage({ type: 'RESET_TOUR' }, '*');
          if (nameLabel) {
            nameLabel.textContent = 'Capa Oficial';
          }
        }
      } catch (e) {}
    });
  }, {
    threshold: 0.25
  });

  // Trata carregamento do iframe
  iframe.addEventListener('load', () => {
    const rect = mockupWrapper.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (isVisible) {
      iframe.contentWindow?.postMessage({ type: 'START_TOUR' }, '*');
    }
  });

  observer.observe(mockupWrapper);
}

/* ── 5. FAQ Accordion ────────────────────────────────────────────────────── */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach((item) => {
    const btn = item.querySelector('.faq-question-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      faqItems.forEach((other) => {
        if (other !== item) {
          other.classList.remove('is-open');
        }
      });

      if (isOpen) {
        item.classList.remove('is-open');
      } else {
        item.classList.add('is-open');
      }
    });
  });
}

/* ── 6. Style Demo Switcher / Tabs ────────────────────────────────────────── */
function initStyleTabs() {
  const tabBtns = document.querySelectorAll('.demo-tab-btn');
  const iframe = document.querySelector('[data-demo-frame]');
  
  if (!tabBtns.length) return;

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const src = btn.getAttribute('data-demo-src');
      if (iframe && src) {
        iframe.src = src;
      }
    });
  });
}

/* ── 7. Smooth Scroll for Anchor Links ───────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/* ── 8. Showroom de Modelos ao Vivo (Carrossel Swipe + Seletor de Cores) ──── */
function initModelsShowroom() {
  const track = document.getElementById('models-carousel-track');
  const prevBtn = document.getElementById('models-btn-prev');
  const nextBtn = document.getElementById('models-btn-next');
  const dots = document.querySelectorAll('.models-dot');
  const paletteBtns = document.querySelectorAll('.models-palette-btn');
  const slides = document.querySelectorAll('.models-slide');

  if (!track || !slides.length) return;

  let activeIndex = 0;

  function scrollToSlide(index) {
    if (index < 0) index = 0;
    if (index >= slides.length) index = slides.length - 1;
    activeIndex = index;

    const slideWidth = track.clientWidth;
    track.scrollTo({
      left: slideWidth * activeIndex,
      behavior: 'smooth'
    });

    updateDots();
    updateArrows();
  }

  function updateDots() {
    dots.forEach((dot, idx) => {
      dot.classList.toggle('is-active', idx === activeIndex);
    });
  }

  function updateArrows() {
    if (prevBtn) {
      if (activeIndex <= 0) {
        prevBtn.classList.add('is-hidden');
      } else {
        prevBtn.classList.remove('is-hidden');
      }
    }
    if (nextBtn) {
      if (activeIndex >= slides.length - 1) {
        nextBtn.classList.add('is-hidden');
      } else {
        nextBtn.classList.remove('is-hidden');
      }
    }
  }

  // Inicializa setas no estado inicial
  updateArrows();

  if (prevBtn) {
    prevBtn.addEventListener('click', () => scrollToSlide(activeIndex - 1));
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => scrollToSlide(activeIndex + 1));
  }

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.getAttribute('data-models-slide'), 10);
      scrollToSlide(idx);
    });
  });

  // Atualiza dot ativo e setas no scroll touch / manual
  let scrollTimeout;
  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const slideWidth = track.clientWidth || 1;
      const newIndex = Math.round(track.scrollLeft / slideWidth);
      if (newIndex >= 0 && newIndex < slides.length) {
        if (newIndex !== activeIndex) {
          activeIndex = newIndex;
          updateDots();
        }
        updateArrows();
      }
    }, 40);
  }, { passive: true });

  // Seletor Global de Paleta (Troca todos os modelos simultaneamente)
  paletteBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      paletteBtns.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const color = btn.getAttribute('data-models-color'); // 'midnight' ou 'rose'
      const colorLabel = color === 'midnight' ? 'Midnight' : 'Rosé';

      slides.forEach((slide) => {
        const iframe = slide.querySelector('.showroom-iframe');
        const btnLink = slide.querySelector('.models-slide-btn');

        if (iframe) {
          const newSrc = color === 'rose' ? iframe.getAttribute('data-src-rose') : iframe.getAttribute('data-src-midnight');
          if (newSrc && iframe.src !== newSrc) {
            iframe.style.opacity = '0.25';
            setTimeout(() => {
              iframe.src = newSrc;
              iframe.style.opacity = '1';
            }, 120);
          }
        }

        if (btnLink) {
          const newLink = color === 'rose' ? btnLink.getAttribute('data-link-rose') : btnLink.getAttribute('data-link-midnight');
          if (newLink) {
            btnLink.href = newLink;
          }
        }
      });
    });
  });
}

/* ── 9. PostHog Analytics & Event Tracking (LPB - Glamour Rosé) ───────────── */
function initLashAnalyticsLPB() {
  if (!window.LashAnalytics) return;

  const VARIANT = 'LPB - Glamour Rosé';

  // Rastrear visualização com variante
  window.LashAnalytics.track('lp_viewed', { lp_variant: VARIANT });

  // Ativar Rastreamento de Scroll Depth (25%, 50%, 75%, 90%)
  window.LashAnalytics.initScrollDepthTracking(VARIANT);

  // Rastrear cliques nos CTAs de compra
  const btnEssencial = document.getElementById('cta-essencial');
  if (btnEssencial) {
    btnEssencial.addEventListener('click', () => {
      window.LashAnalytics.track('InitiateCheckout', {
        plan: 'essencial',
        price: 197.00,
        currency: 'BRL',
        lp_variant: VARIANT,
        button_location: 'pricing_card'
      });
    });
  }

  const btnCustom = document.getElementById('cta-custom');
  if (btnCustom) {
    btnCustom.addEventListener('click', () => {
      window.LashAnalytics.track('InitiateCheckout', {
        plan: 'custom',
        price: 297.00,
        currency: 'BRL',
        lp_variant: VARIANT,
        button_location: 'pricing_card'
      });
    });
  }

  // CTAs adicionais (Hero, Sticky mobile, etc.)
  document.querySelectorAll('a[href="#pacotes"]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.LashAnalytics.track('cta_click', {
        cta_label: btn.textContent.trim(),
        target_section: '#pacotes',
        lp_variant: VARIANT
      });
    });
  });

  // Interação com FAQ
  document.querySelectorAll('.faq-item').forEach(item => {
    const questionBtn = item.querySelector('.faq-question-btn');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        setTimeout(() => {
          if (item.classList.contains('is-open')) {
            const questionText = questionBtn.textContent.trim();
            window.LashAnalytics.track('faq_opened', {
              question: questionText,
              lp_variant: VARIANT
            });
          }
        }, 50);
      });
    }
  });

  // Troca de cores / paleta no Showroom
  document.querySelectorAll('.models-palette-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.getAttribute('data-models-color');
      window.LashAnalytics.track('palette_changed', {
        selected_color: color,
        lp_variant: VARIANT
      });
    });
  });
}

/* ── 10. Modal de Test Drive Interativo na Prática ───────────────────────── */
function initTestDriveModal() {
  const modal = document.getElementById('testdrive-modal');
  const iframe = document.getElementById('testdrive-iframe');
  const openBtns = document.querySelectorAll('[data-open-testdrive]');
  const closeBtns = document.querySelectorAll('[data-close-testdrive]');

  if (!modal || !iframe) return;

  const DEMO_URL = '../../glamour-midnight/index.html?interactive=1&v=2026';

  function updateIframeScale() {
    const phone = modal.querySelector('.testdrive-phone');
    const scaler = modal.querySelector('.testdrive-screen-scaler');
    if (!phone || !scaler) return;
    const phoneWidth = phone.clientWidth;
    if (phoneWidth > 0) {
      const scale = phoneWidth / 390;
      scaler.style.transform = `scale(${scale})`;
    }
  }

  window.addEventListener('resize', updateIframeScale);

  function preventTouchScroll(e) {
    if (!e.target.closest('#testdrive-iframe')) {
      e.preventDefault();
    }
  }

  function openModal() {
    if (iframe.src === 'about:blank' || !iframe.src.includes('glamour-midnight')) {
      iframe.src = DEMO_URL;
    }
    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('testdrive-open');

    // Bloqueio rigoroso de touch no fundo da página em dispositivos móveis
    modal.addEventListener('touchmove', preventTouchScroll, { passive: false });

    setTimeout(updateIframeScale, 50);
    setTimeout(updateIframeScale, 300);

    if (window.LashAnalytics) {
      window.LashAnalytics.track('test_drive_opened', {
        lp_variant: 'LPB - Glamour Rosé',
        trigger_location: 'hero_mockup'
      });
    }
  }

  function closeModal() {
    modal.classList.remove('is-active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('testdrive-open');
    modal.removeEventListener('touchmove', preventTouchScroll);

    if (window.LashAnalytics) {
      window.LashAnalytics.track('test_drive_closed', {
        lp_variant: 'LPB - Glamour Rosé'
      });
    }

    // Rolagem suave automática para a próxima seção ("A diferença na prática" - #comparativo)
    const nextSection = document.getElementById('comparativo');
    if (nextSection) {
      setTimeout(() => {
        nextSection.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }

  openBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });

    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal();
      }
    });
  });

  closeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      closeModal();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-active')) {
      closeModal();
    }
  });

  // Evento no botão de compra dentro do modal
  const buyBtn = modal.querySelector('.testdrive-buy-btn');
  if (buyBtn) {
    buyBtn.addEventListener('click', () => {
      if (window.LashAnalytics) {
        window.LashAnalytics.track('test_drive_cta_clicked', {
          lp_variant: 'LPB - Glamour Rosé'
        });
      }
    });
  }
}

/* ── 11. Hero Phone Scaler (Modelo 02 Harmonia Rosé - Calibração Fina) ──── */
function initHeroPhoneScaler() {
  const phone = document.querySelector('.testdrive-phone');
  const scaler = document.querySelector('.testdrive-screen-scaler');
  if (!phone || !scaler) return;

  function updateScale() {
    const isMobile = window.innerWidth <= 480;
    // No celular: 72% da largura da tela (máximo 280px) para ter margens laterais confortáveis
    // No desktop: 330px
    const targetW = isMobile ? Math.min(window.innerWidth * 0.72, 280) : 330;
    const scale = targetW / 390;

    scaler.style.transform = `scale(${scale})`;
    phone.style.width = `${Math.round(390 * scale)}px`;
    phone.style.height = `${Math.round(844 * scale)}px`;
  }

  window.addEventListener('resize', updateScale);
  window.addEventListener('orientationchange', updateScale);
  updateScale();
  setTimeout(updateScale, 50);
  setTimeout(updateScale, 200);
  setTimeout(updateScale, 600);
}
