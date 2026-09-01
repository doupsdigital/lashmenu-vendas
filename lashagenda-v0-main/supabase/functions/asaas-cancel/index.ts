// Edge Function: asaas-cancel
// Cancela a assinatura no Asaas e atualiza o banco.

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
    const { estabelecimento_id } = await req.json()

    const ASAAS_API_KEY        = Deno.env.get('ASAAS_API_KEY')!
    const ASAAS_BASE_URL       = Deno.env.get('ASAAS_BASE_URL')!
    const SB_SERVICE_ROLE_KEY  = Deno.env.get('SB_SERVICE_ROLE_KEY')!
    const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!

    const supabase = createClient(SUPABASE_URL, SB_SERVICE_ROLE_KEY)

    const { data: estab } = await supabase
      .from('estabelecimentos')
      .select('billing_subscription_id')
      .eq('id', estabelecimento_id)
      .single()

    if (!estab?.billing_subscription_id) {
      throw new Error('Assinatura nao encontrada')
    }

    const cancelRes = await fetch(
      `${ASAAS_BASE_URL}/subscriptions/${estab.billing_subscription_id}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_KEY,
        },
      }
    )

    if (!cancelRes.ok) {
      const err = await cancelRes.json()
      throw new Error(`Erro ao cancelar no Asaas: ${JSON.stringify(err)}`)
    }

    await supabase
      .from('estabelecimentos')
      .update({
        status_assinatura:       'cancelado',
        billing_subscription_id: null,
      })
      .eq('id', estabelecimento_id)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
