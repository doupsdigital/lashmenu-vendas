/* ==========================================================================
   LASHMENU — MODAL INTERATIVO DE AGENDAMENTO EM TEMPO REAL
   ========================================================================== */

const SchedulingModal = (function() {
  let modalContainer = null;
  let activeOrder = null;
  let activeService = null;
  let selectedDateISO = null;
  let selectedTimeSlot = null; // { time, label, datetime }
  let configSupabase = { url: '', key: '' };

  /**
   * Inicializa e monta a estrutura do modal no DOM se ainda não existir
   */
  function initModalDOM() {
    if (document.getElementById('lm-scheduling-modal')) return;

    modalContainer = document.createElement('div');
    modalContainer.id = 'lm-scheduling-modal';
    modalContainer.className = 'lm-sched-modal-overlay';
    modalContainer.setAttribute('hidden', 'true');

    modalContainer.innerHTML = `
      <style>
        .lm-sched-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 999999;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          box-sizing: border-box;
        }
        .lm-sched-modal-overlay.is-open {
          opacity: 1;
          pointer-events: auto;
        }
        .lm-sched-sheet {
          background: #141210;
          color: #f5ede6;
          width: 100%;
          max-width: 500px;
          border-radius: 24px 24px 0 0;
          padding: 24px;
          max-height: 90vh;
          max-height: 90dvh;
          overflow-y: auto;
          box-shadow: 0 -10px 40px rgba(0,0,0,0.5);
          border: 1px solid rgba(229, 169, 184, 0.15);
          transform: translateY(100%);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }
        .lm-sched-modal-overlay.is-open .lm-sched-sheet {
          transform: translateY(0);
        }
        @media (min-width: 600px) {
          .lm-sched-modal-overlay {
            align-items: center;
            padding: 20px;
          }
          .lm-sched-sheet {
            border-radius: 24px;
          }
        }
        .lm-sched-close-btn {
          position: absolute;
          top: 18px;
          right: 18px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          color: #a3958c;
          border: none;
          font-size: 1.1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, color 0.2s;
        }
        .lm-sched-close-btn:hover {
          background: rgba(255, 255, 255, 0.18);
          color: #fff;
        }
        .lm-sched-header {
          margin-bottom: 20px;
          padding-right: 36px;
        }
        .lm-sched-badge {
          display: inline-block;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #e5a9b8;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .lm-sched-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.6rem;
          font-weight: 400;
          color: #fff;
          margin: 0 0 4px 0;
          line-height: 1.2;
        }
        .lm-sched-meta {
          font-size: 0.85rem;
          color: #a3958c;
        }
        .lm-sched-section-title {
          font-size: 0.88rem;
          font-weight: 600;
          color: #d4c7bd;
          margin: 16px 0 10px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        /* Grid de Dias */
        .lm-sched-dates-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 8px;
          scrollbar-width: none;
        }
        .lm-sched-dates-scroll::-webkit-scrollbar { display: none; }
        .lm-sched-date-btn {
          flex: 0 0 auto;
          width: 62px;
          height: 68px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #d4c7bd;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .lm-sched-date-btn .wday { font-size: 0.7rem; text-transform: uppercase; opacity: 0.7; }
        .lm-sched-date-btn .mday { font-size: 1.2rem; font-weight: 700; color: #fff; margin-top: 2px; }
        .lm-sched-date-btn.is-active {
          background: #e5a9b8;
          border-color: #e5a9b8;
          color: #0d0b0a;
        }
        .lm-sched-date-btn.is-active .wday,
        .lm-sched-date-btn.is-active .mday { color: #0d0b0a; }
        
        /* Grid de Horários */
        .lm-sched-slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 8px;
          margin-top: 8px;
          max-height: 180px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .lm-sched-slot-btn {
          padding: 10px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
        }
        .lm-sched-slot-btn:hover {
          border-color: rgba(229, 169, 184, 0.5);
        }
        .lm-sched-slot-btn.is-active {
          background: #e5a9b8;
          border-color: #e5a9b8;
          color: #0d0b0a;
        }
        .lm-sched-empty-slots {
          padding: 18px;
          text-align: center;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          color: #a3958c;
          font-size: 0.85rem;
        }

        /* Form Inputs */
        .lm-sched-input-group {
          margin-bottom: 14px;
        }
        .lm-sched-input-group label {
          display: block;
          font-size: 0.78rem;
          color: #a3958c;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .lm-sched-input {
          width: 100%;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          color: #fff;
          font-size: 0.95rem;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .lm-sched-input:focus {
          border-color: #e5a9b8;
        }

        /* Botão Ação */
        .lm-sched-btn-confirm {
          width: 100%;
          padding: 14px;
          background: #e5a9b8;
          color: #0d0b0a;
          border: none;
          border-radius: 100px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          margin-top: 16px;
          transition: opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .lm-sched-btn-confirm:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .lm-sched-btn-whatsapp {
          background: #25d366 !important;
          color: #fff !important;
        }
      </style>
      
      <div class="lm-sched-sheet" id="lm-sched-sheet-body">
        <button type="button" class="lm-sched-close-btn" id="lm-sched-close">✕</button>
        <div id="lm-sched-step-content"></div>
      </div>
    `;

    document.body.appendChild(modalContainer);

    document.getElementById('lm-sched-close').addEventListener('click', closeModal);
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) closeModal();
    });
  }

  function openModal(order, service, supabaseUrl, supabaseKey) {
    initModalDOM();

    activeOrder = order;
    activeService = service;
    configSupabase.url = supabaseUrl;
    configSupabase.key = supabaseKey;

    selectedDateISO = SchedulingEngine.formatDateISO(new Date());
    selectedTimeSlot = null;

    modalContainer.removeAttribute('hidden');
    requestAnimationFrame(() => {
      modalContainer.classList.add('is-open');
    });

    renderStepSelectDateTime();
  }

  function closeModal() {
    if (!modalContainer) return;
    modalContainer.classList.remove('is-open');
    setTimeout(() => {
      modalContainer.setAttribute('hidden', 'true');
    }, 300);
  }

  /**
   * Renderiza Passo 1: Seleção de Data e Horário
   */
  async function renderStepSelectDateTime() {
    const content = document.getElementById('lm-sched-step-content');
    if (!content) return;

    const priceText = activeService.price ? `R$ ${activeService.price}` : 'Consulte';
    const durationText = activeService.duration || `${activeService.duracao_minutos || 60}min`;

    content.innerHTML = `
      <div class="lm-sched-header">
        <span class="lm-sched-badge">Agendamento em Tempo Real</span>
        <h2 class="lm-sched-title">${activeService.name}</h2>
        <p class="lm-sched-meta">${priceText} · ${durationText}</p>
      </div>

      <div class="lm-sched-section-title">
        <span>1. Escolha a Data</span>
      </div>
      <div class="lm-sched-dates-scroll" id="lm-sched-dates-container"></div>

      <div class="lm-sched-section-title">
        <span>2. Escolha o Horário Vago</span>
      </div>
      <div id="lm-sched-slots-container">
        <div class="lm-sched-empty-slots">Carregando horários vagos...</div>
      </div>

      <button type="button" class="lm-sched-btn-confirm" id="lm-sched-btn-next-step" disabled>
        <span>Avançar para Identificação</span>
        <span>→</span>
      </button>
    `;

    // Renderiza Lista dos Próximos 14 Dias
    renderDatesList();

    // Carrega horários vagos da data selecionada inicial
    await loadSlotsForSelectedDate();

    document.getElementById('lm-sched-btn-next-step').addEventListener('click', () => {
      if (selectedTimeSlot) {
        renderStepClientInfo();
      }
    });
  }

  function renderDatesList() {
    const container = document.getElementById('lm-sched-dates-container');
    if (!container) return;

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    let html = '';

    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = SchedulingEngine.formatDateISO(d);

      const wday = weekDays[d.getDay()];
      const mday = d.getDate();
      const isActive = iso === selectedDateISO ? 'is-active' : '';

      html += `
        <button type="button" class="lm-sched-date-btn ${isActive}" data-iso="${iso}">
          <span class="wday">${wday}</span>
          <span class="mday">${mday}</span>
        </button>
      `;
    }

    container.innerHTML = html;

    container.querySelectorAll('.lm-sched-date-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        container.querySelectorAll('.lm-sched-date-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        selectedDateISO = btn.getAttribute('data-iso');
        selectedTimeSlot = null;
        document.getElementById('lm-sched-btn-next-step').disabled = true;

        await loadSlotsForSelectedDate();
      });
    });
  }

  async function loadSlotsForSelectedDate() {
    const container = document.getElementById('lm-sched-slots-container');
    if (!container) return;

    container.innerHTML = '<div class="lm-sched-empty-slots">Buscando horários na agenda...</div>';

    try {
      const slots = await SchedulingEngine.fetchAvailableSlots({
        supabaseUrl: configSupabase.url,
        supabaseKey: configSupabase.key,
        orderId: activeOrder.id,
        duracaoMinutos: activeService.duracao_minutos || 60,
        dataSelecionadaISO: selectedDateISO
      });

      if (slots.length === 0) {
        container.innerHTML = `
          <div class="lm-sched-empty-slots">
            Sem horários disponíveis para este dia.<br>
            <small style="opacity: 0.7;">Por favor, selecione outra data acima.</small>
          </div>
        `;
        return;
      }

      let gridHtml = '<div class="lm-sched-slots-grid">';
      slots.forEach(slot => {
        const isActive = selectedTimeSlot && selectedTimeSlot.time === slot.time ? 'is-active' : '';
        gridHtml += `
          <button type="button" class="lm-sched-slot-btn ${isActive}" data-time="${slot.time}" data-datetime="${slot.datetime}">
            ${slot.time}
          </button>
        `;
      });
      gridHtml += '</div>';

      container.innerHTML = gridHtml;

      container.querySelectorAll('.lm-sched-slot-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.lm-sched-slot-btn').forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');

          selectedTimeSlot = {
            time: btn.getAttribute('data-time'),
            datetime: btn.getAttribute('data-datetime')
          };

          document.getElementById('lm-sched-btn-next-step').disabled = false;
        });
      });

    } catch (err) {
      console.error('Erro ao buscar slots:', err);
      container.innerHTML = '<div class="lm-sched-empty-slots">Erro ao consultar agenda. Tente novamente.</div>';
    }
  }

  /**
   * Renderiza Passo 2: Formulário de Identificação do Cliente Final
   */
  function renderStepClientInfo() {
    const content = document.getElementById('lm-sched-step-content');
    if (!content) return;

    const [y, m, d] = selectedDateISO.split('-');
    const dateFormatted = `${d}/${m}/${y}`;

    content.innerHTML = `
      <div class="lm-sched-header">
        <span class="lm-sched-badge">Passo 2 de 2</span>
        <h2 class="lm-sched-title">Seus Dados de Contato</h2>
        <p class="lm-sched-meta">Horário: <strong>${dateFormatted} às ${selectedTimeSlot.time}</strong></p>
      </div>

      <form id="lm-sched-form">
        <div class="lm-sched-input-group">
          <label for="lm-input-nome">Seu Nome Completo *</label>
          <input type="text" id="lm-input-nome" class="lm-sched-input" placeholder="Ex: Maria Silva" required>
        </div>

        <div class="lm-sched-input-group">
          <label for="lm-input-whatsapp">Seu WhatsApp (com DDD) *</label>
          <input type="tel" id="lm-input-whatsapp" class="lm-sched-input" placeholder="(62) 99999-9999" required>
        </div>

        <div class="lm-sched-input-group">
          <label for="lm-input-obs">Observações (opcional)</label>
          <input type="text" id="lm-input-obs" class="lm-sched-input" placeholder="Ex: Primeira vez fazendo cílios">
        </div>

        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="button" class="lm-sched-btn-confirm" id="lm-btn-back" style="background: rgba(255,255,255,0.08); color: #fff; width: 40%;">
            <span>← Voltar</span>
          </button>
          <button type="submit" class="lm-sched-btn-confirm" id="lm-btn-submit" style="width: 60%;">
            <span>Confirmar Agendamento</span>
          </button>
        </div>
      </form>
    `;

    document.getElementById('lm-btn-back').addEventListener('click', () => {
      renderStepSelectDateTime();
    });

    const form = document.getElementById('lm-sched-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nome = document.getElementById('lm-input-nome').value.trim();
      const whatsapp = document.getElementById('lm-input-whatsapp').value.trim();
      const obs = document.getElementById('lm-input-obs').value.trim();

      if (!nome || !whatsapp) return;

      const submitBtn = document.getElementById('lm-btn-submit');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Salvando...</span>';

      try {
        const agendamentoCriado = await SchedulingEngine.createAgendamento({
          supabaseUrl: configSupabase.url,
          supabaseKey: configSupabase.key,
          orderId: activeOrder.id,
          serviceId: activeService.id,
          nomeCliente: nome,
          whatsappCliente: whatsapp,
          dataHoraISO: selectedTimeSlot.datetime,
          duracaoMinutos: activeService.duracao_minutos || 60,
          observacoes: obs
        });

        renderStepSuccess(agendamentoCriado, nome, whatsapp);
      } catch (err) {
        console.error('Erro ao agendar:', err);
        alert('Ocorreu um erro ao registrar seu agendamento. Por favor tente novamente.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Confirmar Agendamento</span>';
      }
    });
  }

  /**
   * Renderiza Passo 3: Confirmação e Gatilho WhatsApp
   */
  function renderStepSuccess(agendamento, nome, whatsapp) {
    const content = document.getElementById('lm-sched-step-content');
    if (!content) return;

    const [y, m, d] = selectedDateISO.split('-');
    const dateFormatted = `${d}/${m}/${y}`;
    const designerFirstName = (activeOrder.client_name || 'Lash Designer').split(' ')[0];
    const cleanPhone = (activeOrder.whatsapp || '').replace(/\D/g, '');

    const waMsg = `Olá, ${designerFirstName}! Acabei de agendar no seu catálogo LashMenu:\n\n` +
      `📌 *Procedimento:* ${activeService.name}\n` +
      `📅 *Data:* ${dateFormatted} às ${selectedTimeSlot.time}\n` +
      `👤 *Cliente:* ${nome}\n` +
      `📱 *WhatsApp:* ${whatsapp}\n\n` +
      `Aguardando sua confirmação!`;

    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waMsg)}`;

    content.innerHTML = `
      <div style="text-align: center; padding: 10px 0 20px 0;">
        <div style="width: 56px; height: 56px; background: rgba(37, 211, 102, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; color: #25d366; font-size: 1.8rem;">
          ✓
        </div>
        <h2 class="lm-sched-title" style="font-size: 1.8rem; margin-bottom: 8px;">Horário Solicitado!</h2>
        <p class="lm-sched-meta" style="font-size: 0.92rem; line-height: 1.5; margin-bottom: 20px;">
          Seu agendamento para <strong>${activeService.name}</strong> em <strong>${dateFormatted} às ${selectedTimeSlot.time}</strong> foi registrado com sucesso!
        </p>

        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 16px; text-align: left; margin-bottom: 24px; font-size: 0.88rem; color: #d4c7bd;">
          <p style="margin-bottom: 6px;">📍 <strong>Estúdio:</strong> ${activeOrder.client_name}</p>
          <p style="margin-bottom: 6px;">🕒 <strong>Duração:</strong> ${activeService.duration || '1h30'}</p>
          <p>💳 <strong>Valor:</strong> R$ ${activeService.price || 'Consulte'}</p>
        </div>

        <a href="${waUrl}" target="_blank" rel="noopener" class="lm-sched-btn-confirm lm-sched-btn-whatsapp" style="text-decoration: none;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.43 0-2.82-.37-4.05-1.08l-.29-.17-3.12.82.83-3.04-.19-.3a8.132 8.132 0 0 1-1.25-4.46c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.58c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.22-.16-.47-.28z"/></svg>
          <span>Notificar ${designerFirstName} no WhatsApp</span>
        </a>
      </div>
    `;
  }

  return {
    openModal,
    closeModal
  };
})();

if (typeof window !== 'undefined') {
  window.SchedulingModal = SchedulingModal;
}
