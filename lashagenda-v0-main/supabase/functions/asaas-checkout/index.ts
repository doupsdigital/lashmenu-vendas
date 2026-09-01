// Edge Function: asaas-checkout
// Cria ou recupera o cliente no Asaas, cria a assinatura e retorna o QR Code Pix.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { estabelecimento_id, plano, email, nome, cpf_cnpj, mode } = await req.json()

    const ASAAS_API_KEY  = Deno.env.get('ASAAS_API_KEY')!
    const ASAAS_BASE_URL = Deno.env.get('ASAAS_BASE_URL')!
    const SB_SERVICE_ROLE_KEY = Deno.env.get('SB_SERVICE_ROLE_KEY')!
    const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!

    const supabase = createClient(SUPABASE_URL, SB_SERVICE_ROLE_KEY)

    const asaasHeaders = {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY,
    }

    // 1. Encontra ou cria o cliente no Asaas
    let customerId: string

    const searchRes = await fetch(
      `${ASAAS_BASE_URL}/customers?email=${encodeURIComponent(email)}`,
      { headers: asaasHeaders }
    )
    const searchData = await searchRes.json()

    if (searchData.data && searchData.data.length > 0) {
      customerId = searchData.data[0].id

      // Atualiza o cliente com CPF/CNPJ + todos os campos obrigatórios
      const putRes = await fetch(`${ASAAS_BASE_URL}/customers/${customerId}`, {
        method: 'PUT',
        headers: asaasHeaders,
        body: JSON.stringify({ name: nome, email: email, cpfCnpj: cpf_cnpj }),
      })
      const putData = await putRes.json()

      if (!putData.id) {
        // PUT falhou — exclui e recria com CPF
        await fetch(`${ASAAS_BASE_URL}/customers/${customerId}`, {
          method: 'DELETE',
          headers: asaasHeaders,
        })
        const reCreateRes = await fetch(`${ASAAS_BASE_URL}/customers`, {
          method: 'POST',
          headers: asaasHeaders,
          body: JSON.stringify({ name: nome, email: email, cpfCnpj: cpf_cnpj }),
        })
        const reCreated = await reCreateRes.json()
        if (!reCreated.id) throw new Error(`Erro ao recriar cliente: ${JSON.stringify(reCreated)}`)
        customerId = reCreated.id
      }
    } else {
      const createRes = await fetch(`${ASAAS_BASE_URL}/customers`, {
        method: 'POST',
        headers: asaasHeaders,
        body: JSON.stringify({ name: nome, email: email, cpfCnpj: cpf_cnpj }),
      })
      const customer = await createRes.json()
      if (!customer.id) throw new Error(`Erro ao criar cliente: ${JSON.stringify(customer)}`)
      customerId = customer.id
    }

    // 2. Cria a assinatura
    const valor     = plano === 'premium' ? 99.90 : 69.90
    const descricao = plano === 'premium' ? 'Lash Agenda — Plano Premium' : 'Lash Agenda — Plano Agenda'
    const hoje      = new Date().toISOString().split('T')[0]

    const createSubRes = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: asaasHeaders,
      body: JSON.stringify({
        customer:    customerId,
        billingType: mode === 'card' ? 'UNDEFINED' : 'PIX',
        value:       valor,
        nextDueDate: hoje,
        cycle:       'MONTHLY',
        description: descricao,
      }),
    })
    const subscription = await createSubRes.json()
    if (!subscription.id) throw new Error(`Erro ao criar assinatura: ${JSON.stringify(subscription)}`)

    // 3. Busca o primeiro pagamento — retry de até 4x pois em produção pode haver delay
    let payment = null
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 2000))
      const paymentsRes = await fetch(
        `${ASAAS_BASE_URL}/payments?subscription=${subscription.id}`,
        { headers: asaasHeaders }
      )
      const paymentsData = await paymentsRes.json()
      if (paymentsData.data?.[0]) { payment = paymentsData.data[0]; break }
    }
    if (!payment) throw new Error('Nenhum pagamento encontrado para a assinatura')

    // 4. Salva os IDs da assinatura no Asaas — NÃO grava `plano` aqui: isso só
    // pode acontecer depois que o pagamento for de fato confirmado (webhook ou
    // asaas-check-payment), senão qualquer um vira Premium só de gerar o Pix
    // ou abrir o checkout de cartão, sem pagar nada.
    await supabase
      .from('estabelecimentos')
      .update({
        billing_customer_id:     customerId,
        billing_subscription_id: subscription.id,
      })
      .eq('id', estabelecimento_id)

    // Modo cartão: retorna invoiceUrl + paymentId (necessário para polling)
    if (mode === 'card') {
      return new Response(
        JSON.stringify({ invoiceUrl: payment.invoiceUrl, paymentId: payment.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Modo pix: busca o QR Code e retorna tudo
    const qrRes  = await fetch(`${ASAAS_BASE_URL}/payments/${payment.id}/pixQrCode`, { headers: asaasHeaders })
    const qrCode = await qrRes.json()

    return new Response(
      JSON.stringify({
        paymentId:      payment.id,
        subscriptionId: subscription.id,
        valor,
        pixQrCodeImage: qrCode.encodedImage,
        pixKey:         qrCode.payload,
        expirationDate: qrCode.expirationDate,
        invoiceUrl:     payment.invoiceUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
