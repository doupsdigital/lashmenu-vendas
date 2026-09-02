const SUPABASE_URL = 'https://qmaugeipttwvxnfkzsed.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtYXVnZWlwdHR3dnhuZmt6c2VkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI3NzMzOCwiZXhwIjoyMTAzODUzMzM4fQ.Qg1je2cDdSL4o4C49kSWtsdsLx9idNqEJIQy9OelFc0';

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 BATERIA DE TESTES AUTOMATIZADOS: LASH DESIGNER APP');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`  ✅ PASSOU: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FALHOU: ${message} ${details ? '-> ' + JSON.stringify(details) : ''}`);
      failed++;
    }
  }

  try {
    // TESTE 1: Leitura da Order / Estúdio
    console.log('▶ Teste 1: Leitura do Estúdio (estudio-demo)...');
    const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?slug=eq.estudio-demo&select=*`, { headers });
    const orders = await orderRes.json();
    assert(orders && orders.length > 0, 'Estúdio estudio-demo localizado no banco', orders);
    const order = orders[0];
    const orderId = order.id;
    assert(typeof order.client_name === 'string', `Nome do cliente retornado: "${order.client_name}"`);

    // TESTE 2: CRUD de Procedimentos
    console.log('\n▶ Teste 2: CRUD de Procedimentos (order_services)...');
    const newSvcPayload = {
      order_id: orderId,
      name: 'Volume Híbrido Automação',
      price: 160.00,
      duracao_minutos: 90,
      order_index: 99
    };
    const newSvcRes = await fetch(`${SUPABASE_URL}/rest/v1/order_services`, {
      method: 'POST',
      headers,
      body: JSON.stringify(newSvcPayload)
    });
    const createdSvcs = await newSvcRes.json();
    assert(Array.isArray(createdSvcs) && createdSvcs.length > 0, 'Novo procedimento inserido com sucesso', createdSvcs);
    
    if (Array.isArray(createdSvcs) && createdSvcs.length > 0) {
      const svcId = createdSvcs[0].id;

      // Update Procedimento
      const updateSvcRes = await fetch(`${SUPABASE_URL}/rest/v1/order_services?id=eq.${svcId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ price: 175.00 })
      });
      const updatedSvcs = await updateSvcRes.json();
      assert(Array.isArray(updatedSvcs) && Number(updatedSvcs[0].price) === 175, 'Preço do procedimento atualizado para 175.00', updatedSvcs);

      // Clean up procedimento
      await fetch(`${SUPABASE_URL}/rest/v1/order_services?id=eq.${svcId}`, { method: 'DELETE', headers });
      console.log('  🧹 Limpeza: Procedimento de teste removido.');
    }

    // TESTE 3: Ciclo de Vida do Agendamento (Status Transition)
    console.log('\n▶ Teste 3: Ciclo de Vida de Agendamento (Pendente -> Confirmado -> Concluído)...');
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 1); // Amanhã
    const dateISO = testDate.toISOString().substring(0, 10);
    const dataHoraStr = `${dateISO}T10:00:00`;

    const createBookingRes = await fetch(`${SUPABASE_URL}/rest/v1/agendamentos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        order_id: orderId,
        nome_cliente: 'Cliente Teste Automação',
        whatsapp_cliente: '5511999999999',
        data_hora: dataHoraStr,
        duracao_minutos: 90,
        status: 'pendente'
      })
    });
    const createdBookings = await createBookingRes.json();
    assert(Array.isArray(createdBookings) && createdBookings.length > 0, 'Agendamento pendente criado no banco', createdBookings);
    
    if (Array.isArray(createdBookings) && createdBookings.length > 0) {
      const bookingId = createdBookings[0].id;
      assert(createdBookings[0].status === 'pendente', 'Status inicial é "pendente"');

      // Transição: Pendente -> Confirmado
      const confirmRes = await fetch(`${SUPABASE_URL}/rest/v1/agendamentos?id=eq.${bookingId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'confirmado' })
      });
      const confirmedBookings = await confirmRes.json();
      assert(Array.isArray(confirmedBookings) && confirmedBookings[0].status === 'confirmado', 'Status transicionado para "confirmado"', confirmedBookings);

      // Transição: Confirmado -> Concluído
      const concludeRes = await fetch(`${SUPABASE_URL}/rest/v1/agendamentos?id=eq.${bookingId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'concluido' })
      });
      const concludedBookings = await concludeRes.json();
      assert(Array.isArray(concludedBookings) && concludedBookings[0].status === 'concluido', 'Status transicionado para "concluido"', concludedBookings);

      // Clean up agendamento
      await fetch(`${SUPABASE_URL}/rest/v1/agendamentos?id=eq.${bookingId}`, { method: 'DELETE', headers });
      console.log('  🧹 Limpeza: Agendamento de teste removido.');
    }

    // TESTE 4: Criação de Bloqueio de Horário
    console.log('\n▶ Teste 4: Trancar Horário (bloqueios_agenda)...');
    const lockRes = await fetch(`${SUPABASE_URL}/rest/v1/bloqueios_agenda`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        order_id: orderId,
        data_inicio: dateISO,
        data_fim: dateISO,
        hora_inicio: '12:00',
        hora_fim: '13:00',
        motivo: 'Almoço Automação',
        dia_inteiro: false
      })
    });
    const createdLocks = await lockRes.json();
    assert(Array.isArray(createdLocks) && createdLocks.length > 0, 'Bloqueio de horário "Almoço Automação" gravado no banco', createdLocks);
    
    if (Array.isArray(createdLocks) && createdLocks.length > 0) {
      const lockId = createdLocks[0].id;
      // Clean up bloqueio
      await fetch(`${SUPABASE_URL}/rest/v1/bloqueios_agenda?id=eq.${lockId}`, { method: 'DELETE', headers });
      console.log('  🧹 Limpeza: Bloqueio de teste removido.');
    }

    // TESTE 5: Atualização da Grade Semanal
    console.log('\n▶ Teste 5: Grade Semanal de Atendimento (horarios_atendimento)...');
    const hoursRes = await fetch(`${SUPABASE_URL}/rest/v1/horarios_atendimento?order_id=eq.${orderId}&select=*`, { headers });
    const hours = await hoursRes.json();
    assert(Array.isArray(hours), 'Grade semanal recuperada com sucesso', hours);

    console.log('\n====================================================');
    console.log(`📊 RESULTADO FINAL DA BATERIA DE TESTES:`);
    console.log(`  Passaram: ${passed}`);
    console.log(`  Falharam: ${failed}`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ ERRO CRÍTICO NA EXECUÇÃO DA BATERIA DE TESTES:', err);
    process.exit(1);
  }
}

runTestSuite();
