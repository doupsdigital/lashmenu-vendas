import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-bg px-4 py-12 font-sans">
      <div className="w-full max-w-[720px] mx-auto bg-white border border-border rounded-[20px] shadow-xl p-8 md:p-10">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-rose-600 font-semibold hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <h1 className="font-title font-bold text-3xl text-text-primary mb-1">Política de Privacidade</h1>
        <p className="text-xs text-text-secondary mb-8">Última atualização: 22 de julho de 2026</p>

        <div className="space-y-6 text-sm text-text-primary leading-relaxed">
          <section>
            <h2 className="font-title font-semibold text-lg text-text-primary mb-2">1. Quem somos</h2>
            <p>
              O Lash Agenda é um sistema de agendamento para profissionais de estética (estúdios de cílios,
              salões e prestadoras de serviço independentes). Esta política explica quais dados coletamos,
              por quê, e como cada pessoa que usa o sistema pode exercer seus direitos, em conformidade com
              a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="font-title font-semibold text-lg text-text-primary mb-2">2. Quais dados coletamos</h2>
            <p className="mb-2"><strong>Da profissional (dona da conta):</strong> nome, e-mail, telefone e dados de pagamento da assinatura.</p>
            <p className="mb-2"><strong>Das clientes cadastradas pela profissional:</strong> nome, WhatsApp, e-mail e, quando aplicável, dados de anamnese (histórico de saúde relevante para o procedimento, como alergias e uso de medicamentos) — inseridos diretamente pela profissional para uso exclusivo dela.</p>
            <p>
              Os dados das clientes finais pertencem à relação entre a profissional e sua cliente; o Lash
              Agenda atua apenas como fornecedor da ferramenta que armazena esses dados em nome da
              profissional.
            </p>
          </section>

          <section>
            <h2 className="font-title font-semibold text-lg text-text-primary mb-2">3. Analytics de uso do produto</h2>
            <p className="mb-2">
              Usamos a ferramenta <strong>PostHog</strong> para entender como as profissionais usam o sistema
              (por exemplo, quais telas são mais acessadas e onde encontram dificuldade), com o objetivo de
              melhorar a experiência do produto. Isso pode incluir gravações de sessão e mapas de calor de
              cliques.
            </p>
            <p className="mb-2">
              <strong>Só rastreamos o uso feito pelas profissionais</strong> — nunca o das clientes finais que
              agendam pelo link público. Nas gravações de sessão, campos que exibem dados de clientes (nome,
              WhatsApp, e-mail, dados de anamnese) são automaticamente mascarados antes de saírem do
              navegador.
            </p>
            <p>
              Os dados de uso ficam hospedados no PostHog (servidores na região dos Estados Unidos).
            </p>
          </section>

          <section>
            <h2 className="font-title font-semibold text-lg text-text-primary mb-2">4. Compartilhamento com terceiros</h2>
            <p>
              Utilizamos fornecedores para operar o sistema: Supabase (banco de dados e autenticação),
              PostHog (analytics de produto) e um processador de pagamentos para cobrança da assinatura.
              Cada um deles trata os dados apenas na medida necessária para prestar o serviço contratado.
            </p>
          </section>

          <section>
            <h2 className="font-title font-semibold text-lg text-text-primary mb-2">5. Seus direitos</h2>
            <p>
              Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento, entrando em
              contato pelo e-mail abaixo. Clientes finais que queiram exercer esses direitos sobre seus
              próprios dados devem contatar diretamente a profissional com quem agendaram.
            </p>
          </section>

          <section>
            <h2 className="font-title font-semibold text-lg text-text-primary mb-2">6. Contato</h2>
            <p>
              Dúvidas sobre esta política ou sobre seus dados: <strong>doupsdigital@gmail.com</strong>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
