/* ==========================================================================
   LASHMENU — MOTOR DE AGENDAMENTO E CÁLCULO DE DISPONIBILIDADE EM TEMPO REAL
   ========================================================================== */

const SchedulingEngine = (function() {
  /**
   * Helper para formatar data YYYY-MM-DD
   */
  function formatDateISO(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Converter string HH:MM para minutos desde 00:00
   */
  function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  /**
   * Converter minutos para HH:MM
   */
  function minutesToTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /**
   * Busca horários disponíveis para um determinado serviço em uma determinada data
   * 
   * @param {Object} config
   * @param {string} config.supabaseUrl
   * @param {string} config.supabaseKey
   * @param {string} config.orderId
   * @param {number} config.duracaoMinutos (ex: 120 para 2h)
   * @param {string} config.dataSelecionadaISO (ex: "2026-09-15")
   * @returns {Promise<Array<{time: string, label: string, datetime: string}>>}
   */
  async function fetchAvailableSlots({
    supabaseUrl,
    supabaseKey,
    orderId,
    duracaoMinutos = 60,
    dataSelecionadaISO
  }) {
    if (!orderId || !dataSelecionadaISO) {
      throw new Error('orderId e dataSelecionadaISO são obrigatórios');
    }

    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    };

    // 1. Obter dia da semana (0=Domingo, 1=Segunda, ..., 6=Sábado)
    const [year, month, day] = dataSelecionadaISO.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const diaSemana = dateObj.getDay();

    // 2. Buscar Horário de Atendimento da Profissional para este dia
    const horariosRes = await fetch(
      `${supabaseUrl}/rest/v1/horarios_atendimento?order_id=eq.${orderId}&dia_semana=eq.${diaSemana}&select=*`,
      { headers }
    );
    if (!horariosRes.ok) throw new Error('Falha ao consultar horários de atendimento');
    const horariosData = await horariosRes.json();

    if (!horariosData || horariosData.length === 0) {
      // Profissional não atende neste dia da semana
      return [];
    }

    const expediente = horariosData[0];
    const inicioExpedienteMin = timeToMinutes(expediente.hora_inicio);
    const fimExpedienteMin = timeToMinutes(expediente.hora_fim);

    // 3. Buscar Bloqueios de Agenda para esta data
    const bloqueiosRes = await fetch(
      `${supabaseUrl}/rest/v1/bloqueios_agenda?order_id=eq.${orderId}&data_inicio=lte.${dataSelecionadaISO}&data_fim=gte.${dataSelecionadaISO}&select=*`,
      { headers }
    );
    const bloqueios = bloqueiosRes.ok ? await bloqueiosRes.json() : [];

    // Se houver algum bloqueio de dia inteiro, dia fechado!
    const bloqueioDiaInteiro = bloqueios.some(b => b.dia_inteiro);
    if (bloqueioDiaInteiro) {
      return [];
    }

    // 4. Buscar Agendamentos Ocupados no dia
    const agendamentosRes = await fetch(
      `${supabaseUrl}/rest/v1/agendamentos?order_id=eq.${orderId}&status=neq.cancelado&status=neq.falta&select=data_hora,duracao_minutos`,
      { headers }
    );
    const agendamentosAll = agendamentosRes.ok ? await agendamentosRes.json() : [];

    // Filtrar agendamentos do dia específico
    const agendamentosOcupados = agendamentosAll.filter(a => {
      const aDateISO = formatDateISO(new Date(a.data_hora));
      return aDateISO === dataSelecionadaISO;
    }).map(a => {
      const dt = new Date(a.data_hora);
      const startMin = dt.getHours() * 60 + dt.getMinutes();
      return {
        startMin,
        endMin: startMin + (a.duracao_minutos || 60)
      };
    });

    // Mapear também bloqueios parciais do dia
    const bloqueiosParciais = bloqueios.filter(b => !b.dia_inteiro && b.hora_inicio && b.hora_fim).map(b => ({
      startMin: timeToMinutes(b.hora_inicio),
      endMin: timeToMinutes(b.hora_fim)
    }));

    const todosOcupados = [...agendamentosOcupados, ...bloqueiosParciais];

    // 5. Gerar Grade de Slots (Passos de 30 minutos)
    const STEP_MINUTES = 30;
    const slotsDisponiveis = [];

    // Horário atual se for a data de hoje
    const hojeISO = formatDateISO(new Date());
    const agoraObj = new Date();
    const agoraMin = agoraObj.getHours() * 60 + agoraObj.getMinutes() + 30; // buffer de 30 min se for hoje

    for (let slotStart = inicioExpedienteMin; slotStart + duracaoMinutos <= fimExpedienteMin; slotStart += STEP_MINUTES) {
      const slotEnd = slotStart + duracaoMinutos;

      // Se for hoje, não permite horários retroativos
      if (dataSelecionadaISO === hojeISO && slotStart < agoraMin) {
        continue;
      }

      // Verifica se o slot conflita com algum agendamento ou bloqueio existente
      const temConflito = todosOcupados.some(occ => {
        // Conflito ocorre se slotStart < occ.endMin AND slotEnd > occ.startMin
        return slotStart < occ.endMin && slotEnd > occ.startMin;
      });

      if (!temConflito) {
        const timeFormatted = minutesToTime(slotStart);
        // Formata ISO da data + hora para gravação no banco
        const hh = String(Math.floor(slotStart / 60)).padStart(2, '0');
        const mm = String(slotStart % 60).padStart(2, '0');
        const datetimeISO = `${dataSelecionadaISO}T${hh}:${mm}:00`;

        slotsDisponiveis.push({
          time: timeFormatted,
          label: timeFormatted,
          datetime: datetimeISO
        });
      }
    }

    return slotsDisponiveis;
  }

  /**
   * Grava um novo agendamento no Supabase
   */
  async function createAgendamento({
    supabaseUrl,
    supabaseKey,
    orderId,
    serviceId,
    nomeCliente,
    whatsappCliente,
    dataHoraISO,
    duracaoMinutos,
    observacoes = ''
  }) {
    const payload = {
      order_id: orderId,
      service_id: serviceId || null,
      nome_cliente: nomeCliente,
      whatsapp_cliente: whatsappCliente,
      data_hora: dataHoraISO,
      duracao_minutos: duracaoMinutos,
      status: 'pendente',
      origem: 'catalogo',
      observacoes: observacoes
    };

    const res = await fetch(`${supabaseUrl}/rest/v1/agendamentos`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Erro ao salvar agendamento: ${errText}`);
    }

    const [created] = await res.json();
    return created;
  }

  return {
    fetchAvailableSlots,
    createAgendamento,
    formatDateISO
  };
})();

// Exporta globalmente para uso no browser
if (typeof window !== 'undefined') {
  window.SchedulingEngine = SchedulingEngine;
}
