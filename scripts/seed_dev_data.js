const SUPABASE_URL = 'https://qmaugeipttwvxnfkzsed.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtYXVnZWlwdHR3dnhuZmt6c2VkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI3NzMzOCwiZXhwIjoyMTAzODUzMzM4fQ.Qg1je2cDdSL4o4C49kSWtsdsLx9idNqEJIQy9OelFc0';

async function seedData() {
  console.log('Semeando dados de teste no Supabase Dev...');

  try {
    // 1. Inserir ou atualizar a ordem de teste (Estúdio Demo)
    const orderPayload = {
      slug: 'estudio-demo',
      client_name: 'Estúdio Lash Demo',
      whatsapp: '5562999999999',
      instagram: 'estudiolashdemo',
      location: 'Setor Bueno, Goiânia - GO',
      hero_phrase: 'Especialista em Extensão de Cílios e Design de Olhar.',
      model_id: 'glamour',
      color_id: 'midnight',
      agendamento_ativo: true,
      antecedencia_cancelamento_horas: 24,
      mensagem_pos_agendamento: 'Seu agendamento foi recebido! Em breve entraremos em contato.'
    };

    const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?on_conflict=slug`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation,resolution=merge-duplicates'
      },
      body: JSON.stringify(orderPayload)
    });

    if (!orderRes.ok) {
      const errText = await orderRes.text();
      console.error('Erro ao inserir order:', errText);
      return;
    }

    const [order] = await orderRes.json();
    console.log('✅ Ordem de teste criada/atualizada com sucesso. ID:', order.id);

    // 2. Inserir Procedimentos / Serviços
    const servicesPayload = [
      {
        order_id: order.id,
        name: 'Fio a Fio Clássico',
        price: 150.00,
        duration: '2h',
        duracao_minutos: 120,
        category: 'Extensão de Cílios',
        description: 'Aplicação minuciosa de um fio sintético acoplado a cada cílio natural. Efeito leve e elegante.',
        effect: 'Efeito natural para o dia a dia',
        order_index: 0
      },
      {
        order_id: order.id,
        name: 'Volume Russo',
        price: 200.00,
        duration: '2h30',
        duracao_minutos: 150,
        category: 'Extensão de Cílios',
        description: 'Fans artesanais de 3 a 6 fios ultraleves aplicados em cada cílio. Efeito volumoso e denso.',
        effect: 'Volume marcante e glamouroso',
        order_index: 1
      },
      {
        order_id: order.id,
        name: 'Volume Brasileiro',
        price: 180.00,
        duration: '2h',
        duracao_minutos: 120,
        category: 'Extensão de Cílios',
        description: 'Aplicação com fios em formato Y. Proporciona volume e alinhamento impecável.',
        effect: 'Preenchimento e definição',
        order_index: 2
      },
      {
        order_id: order.id,
        name: 'Lash Lifting',
        price: 120.00,
        duration: '1h',
        duracao_minutos: 60,
        category: 'Tratamentos',
        description: 'Curvatura e tintura dos cílios naturais com tratamento de nutrição e queratina.',
        effect: 'Cílios naturais curvados e pretinhos',
        order_index: 3
      }
    ];

    const servicesRes = await fetch(`${SUPABASE_URL}/rest/v1/order_services`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(servicesPayload)
    });

    if (servicesRes.ok) {
      console.log('✅ 4 Serviços de teste inseridos com sucesso!');
    } else {
      console.error('Erro ao inserir serviços:', await servicesRes.text());
    }

    // 3. Inserir Horários de Atendimento (Seg–Sex: 08:00 às 18:00, Sáb: 08:00 às 13:00)
    const horariosPayload = [
      { order_id: order.id, dia_semana: 1, hora_inicio: '08:00', hora_fim: '18:00' },
      { order_id: order.id, dia_semana: 2, hora_inicio: '08:00', hora_fim: '18:00' },
      { order_id: order.id, dia_semana: 3, hora_inicio: '08:00', hora_fim: '18:00' },
      { order_id: order.id, dia_semana: 4, hora_inicio: '08:00', hora_fim: '18:00' },
      { order_id: order.id, dia_semana: 5, hora_inicio: '08:00', hora_fim: '18:00' },
      { order_id: order.id, dia_semana: 6, hora_inicio: '08:00', hora_fim: '13:00' }
    ];

    const horariosRes = await fetch(`${SUPABASE_URL}/rest/v1/horarios_atendimento`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(horariosPayload)
    });

    if (horariosRes.ok) {
      console.log('✅ Grade de Horários de Atendimento de teste inserida!');
    } else {
      console.error('Erro ao inserir horários:', await horariosRes.text());
    }

    console.log('\n🎉 Semeamento concluído com sucesso!');
  } catch (err) {
    console.error('Erro inesperado no seed:', err);
  }
}

seedData();
