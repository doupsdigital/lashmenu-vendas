# Plano de Implementação: Notificações de Agendamento via WhatsApp

Este documento detalha o planejamento técnico para integrar notificações automáticas no WhatsApp para o estúdio/profissional quando um cliente realiza um agendamento através do Portal do Cliente.

---

## Comparativo de Abordagens

| Critério | Opção 1: Envio Automático (Backend API) | Opção 2: Envio Manual (Navegador do Cliente) |
| :--- | :--- | :--- |
| **Experiência do Usuário (UX)** | **Excelente.** O cliente agenda e a profissional recebe a notificação sem qualquer ação extra. | **Regular.** Exige que o cliente clique em um botão para avisar a profissional. |
| **Garantia de Entrega** | **Alta.** O envio é disparado diretamente pelo banco de dados. | **Média/Baixa.** Se a cliente fechar o navegador ou esquecer de clicar, o aviso não é enviado. |
| **Custo de Operação** | Requer assinatura de Gateway de API de WhatsApp (Ex: Z-API, Evolution API). | **Gratuito.** Utiliza o próprio aplicativo de WhatsApp da cliente. |
| **Complexidade Técnica** | Média/Alta (Configuração de Edge Functions e APIs). | Baixa (Link simples de redirecionamento no frontend). |

---

## Opção 1: Envio Automático em Segundo Plano (Recomendado)

### Arquitetura de Fluxo
```
[Cliente no Portal] -> Grava Agendamento no Banco -> [Supabase Trigger]
                                                               |
                                                       [Supabase Webhook]
                                                               |
                                                     [Supabase Edge Function]
                                                               |
                                                      [API Gateway WhatsApp]
                                                               |
                                                   [WhatsApp da Profissional]
```

### Passo a Passo da Implementação

#### 1. Banco de Dados: Criar Gatilho (Trigger) e Webhook
Configurar uma função e um trigger na tabela `public.agendamentos` para disparar uma requisição HTTP sempre que um novo agendamento com `origem = 'portal'` for inserido.

```sql
-- Função que será chamada pelo Trigger
CREATE OR REPLACE FUNCTION public.notify_new_appointment_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- Dispara apenas para agendamentos feitos pelos clientes no portal
  IF NEW.origem = 'portal' THEN
    PERFORM net.http_post(
      url := 'https://<sua-ref-supabase>.supabase.co/functions/v1/notify-whatsapp',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.jwt.claim.sub', true)
      ),
      body := jsonb_build_object(
        'agendamento_id', NEW.id,
        'estabelecimento_id', NEW.estabelecimento_id,
        'data_hora', NEW.data_hora
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criação do Trigger
CREATE TRIGGER tr_on_new_portal_appointment
AFTER INSERT ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_appointment_webhook();
```

#### 2. Criar a Edge Function no Supabase
Criar um endpoint em `supabase/functions/notify-whatsapp/index.ts` contendo a lógica de formatação e chamada de API do WhatsApp.

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { agendamento_id, estabelecimento_id } = await req.json()

    // 1. Inicializar cliente Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Buscar informações completas do agendamento, cliente e serviços
    const { data: appt, error } = await supabaseAdmin
      .from('agendamentos')
      .select(`
        data_hora,
        cliente:clientes(nome, sobrenome),
        estabelecimento:configuracao_negocio(nome_negocio, telefone_contato),
        agendamento_servicos(
          servico:servicos(nome)
        )
      `)
      .eq('id', agendamento_id)
      .single()

    if (error || !appt) throw new Error('Agendamento não encontrado')

    // 3. Formatar Mensagem
    const dateObj = new Date(appt.data_hora)
    const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const services = appt.agendamento_servicos.map(s => s.servico.nome).join(', ')
    const clientName = `${appt.cliente.nome} ${appt.cliente.sobrenome || ''}`.trim()
    const destinationPhone = appt.estabelecimento.telefone_contato?.replace(/\D/g, '')

    if (!destinationPhone) {
      return new Response(JSON.stringify({ message: 'Telefone do estabelecimento não configurado' }), { status: 400 })
    }

    const messageText = `📢 *Novo Agendamento Recebido!*\n\n*Cliente:* ${clientName}\n*Procedimentos:* ${services}\n*Data:* ${dateStr}\n*Horário:* ${timeStr}\n\nConfira os detalhes no seu painel CRM Rosaê.`

    // 4. Enviar requisição para o Gateway de WhatsApp (Exemplo: Z-API)
    const zapiInstance = Deno.env.get('ZAPI_INSTANCE')
    const zapiToken = Deno.env.get('ZAPI_TOKEN')

    const response = await fetch(`https://api.z-api.io/instances/${zapiInstance}/token/${zapiToken}/send-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: destinationPhone,
        message: messageText
      })
    })

    const result = await response.json()
    return new Response(JSON.stringify({ success: true, result }), { status: 200 })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
```

---

## Opção 2: Envio Semi-Automático pelo Navegador (Alternativa Gratuita)

Esta alternativa depende da ação direta da cliente e é disparada assim que o agendamento é finalizado no portal.

### Passo a Passo da Implementação

#### 1. Obter o Telefone da Profissional
No arquivo `PortalAgendar.tsx`, já carregamos as informações do portal através do contexto `usePortal()`. Adicionaremos a busca pelo telefone de contato do estúdio na tabela `configuracao_negocio`.

#### 2. Exibição Dinâmica do Botão de Aviso na Tela de Sucesso
No componente da etapa de sucesso, adicionamos um botão destacado convidando a cliente a avisar a profissional:

```tsx
// Exemplo de componente na etapa de sucesso (PortalAgendar.tsx)
if (etapa === 'sucesso') {
  const whatsappUrl = `https://wa.me/${telefoneEstudio}?text=${encodeURIComponent(
    `Olá! Acabei de realizar o agendamento de *${servicosList}* para o dia *${dateStr}* às *${timeStr}* pelo portal online! 💖`
  )}`;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-5 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
        <Heart className="w-8 h-8 text-rose-600 fill-rose-600" />
      </div>
      <div className="space-y-2">
        <h2 className="font-title text-2xl font-bold text-text-primary">Agendamento Realizado!</h2>
        <p className="text-sm text-text-secondary">
          Seu agendamento foi salvo no sistema. Clique no botão abaixo para nos avisar e confirmar mais rapidamente.
        </p>
      </div>

      <div className="flex flex-col gap-3 mt-2 w-full">
        {/* Botão de Envio Gratuito */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Avisar Profissional no WhatsApp
        </a>

        <button
          onClick={() => navigate(`/portal/${slug}/meus-agendamentos`)}
          className="py-2.5 border border-border text-text-secondary hover:bg-bg rounded-xl text-sm font-semibold transition-colors"
        >
          Ver meus agendamentos
        </button>
      </div>
    </div>
  );
}
```

---

## Próximos Passos
Quando decidir realizar a implementação:
1. Escolha a abordagem adequada com base em seu modelo de negócios (custo vs. automação).
2. Se optar pela **Opção 1**, realize o cadastro em um provedor de gateway de WhatsApp (ex: Z-API, Evolution, ou Z-PRO) e insira as credenciais no cofre do Supabase (`Settings > Database > Vault` ou `.env`).
