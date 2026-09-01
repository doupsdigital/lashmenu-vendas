import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Bell, Calendar, BookOpen, TrendingUp, Clock, ShieldCheck, Sparkles, ChevronDown, XCircle, CheckCircle2, Users, LayoutGrid, Percent, Monitor, Heart, Zap, Wallet, Smartphone, CreditCard, LogIn } from 'lucide-react';

// ── Animation presets ──────────────────────────────────────────────────────
const EASE = [0.22, 1, 0.36, 1] as const;
const SPRING = { type: 'spring', stiffness: 300, damping: 24 } as const;

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};

const wordReveal = {
  hidden: { opacity: 0, y: 22, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: EASE } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE } },
};

const stagger = (delay = 0.09, delayChildren = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren: delay, delayChildren } },
});

// ── Counter hook ───────────────────────────────────────────────────────────
function useCounter(target: number, duration: number, trigger: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let frame = 0;
    const totalFrames = Math.round(duration / 16);
    const timer = setInterval(() => {
      frame++;
      const eased = 1 - Math.pow(1 - frame / totalFrames, 3);
      setValue(Math.round(eased * target));
      if (frame >= totalFrames) { setValue(target); clearInterval(timer); }
    }, 16);
    return () => clearInterval(timer);
  }, [trigger, target, duration]);
  return value;
}

// ── Palette ────────────────────────────────────────────────────────────────
const P = {
  bg: '#faf8f5',
  card: '#ffffff',
  border: '#ede9e3',
  borderDark: '#ddd5cc',
  accent: '#c84b72',
  accentLight: '#fbedf2',
  accentDark: '#a33a5c',
  text: '#1a1220',
  muted: '#7a6b78',
  faint: '#c4b8c0',
};

// ── Hero word list ─────────────────────────────────────────────────────────
const heroWords = [
  { w: 'Tenha', a: false }, { w: 'o', a: false }, { w: 'seu', a: false },
  { w: 'próprio', a: true }, { w: 'aplicativo', a: true }, { w: 'de', a: false },
  { w: 'agendamentos', a: false }, { w: 'e', a: false }, { w: 'valorize', a: false },
  { w: 'sua', a: false }, { w: 'marca', a: false },
];

const steps = [
  { n: '01', title: 'Você compartilha seu link', desc: 'Cole na bio do Instagram, mande no WhatsApp. É o endereço digital do seu estúdio.' },
  { n: '02', title: 'Sua cliente salva como app', desc: 'Ela abre o link e salva na tela inicial do celular com um toque. Fica o ícone do seu estúdio ali.' },
  { n: '03', title: 'Ela agenda, você recebe o aviso', desc: 'Ela escolhe o serviço e o horário. Você recebe uma notificação no celular na hora.' },
];

const testimonials = [
  { text: 'Minha agenda nunca mais ficou bagunçada. As clientes agendam sozinhas e eu só apareço pra atender.', name: 'Mariana Silva', role: 'Lash Designer • Mariana Cílios' },
  { text: 'Antes abria o WhatsApp e tinha 30 mensagens pra marcar horário. Hoje não existe mais isso.', name: 'Beatriz Oliveira', role: 'Lash Designer • Bia Lash' },
  { text: 'A ficha de cada cliente fica salva. Lembro da curvatura e do mapping sem precisar anotar em papel.', name: 'Gabriela Costa', role: 'Lash Designer • Gabi Cílios' },
];

const faqs = [
  { q: 'Minha cliente precisa baixar algum app?', a: 'Não. Ela acessa o link do seu estúdio e, se quiser, salva na tela inicial do celular como ícone. Funciona igualzinho a um app, mas sem precisar ir em nenhuma loja.' },
  { q: 'O Lash Agenda cobra taxa em cima de cada atendimento?', a: 'Não. O valor de cada procedimento é 100% seu. Você paga apenas a mensalidade fixa do plano.' },
  { q: 'Preciso configurar tudo do zero?', a: 'Não. Quando você entra, o sistema já vem com 10 serviços de Lash e sobrancelhas pré-cadastrados. É só ajustar e começar a usar.' },
  { q: 'Como funciona o período de teste?', a: 'Você ganha 7 dias de acesso completo. Não pedimos cartão de crédito pra começar.' },
];

const badPoints = [
  { icon: <Users size={14} />, text: 'Feitos para grandes clínicas com comissões de funcionários' },
  { icon: <LayoutGrid size={14} />, text: 'Telas com dezenas de botões complexos' },
  { icon: <Percent size={14} />, text: 'Processo de agendamento cansativo para a cliente' },
  { icon: <Monitor size={14} />, text: 'Cobram taxas por agendamento ou comissões extras' },
];

const goodPoints = [
  { icon: <Heart size={14} />, text: '100% pensado na Lash que atende sozinha' },
  { icon: <Zap size={14} />, text: 'Painel simples e amigável: agenda e clientes' },
  { icon: <Wallet size={14} />, text: 'Cliente marca horário sozinha em 3 cliques' },
  { icon: <Smartphone size={14} />, text: 'Mensalidade fixa e transparente, sem nenhuma taxa' },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function LandingPage_OfertaDois() {
  const navigate = useNavigate();
  const { scrollY, scrollYProgress } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    return scrollY.on('change', (v) => setScrolled(v > 80));
  }, [scrollY]);

  // Parallax blobs
  const blob1Y = useTransform(scrollYProgress, [0, 1], ['0%', '-30%']);
  const blob2Y = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  // Counter trigger via Framer Motion useInView
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, amount: 0.3 });
  const c24 = useCounter(24, 1000, statsInView);
  const c3 = useCounter(3, 600, statsInView);
  const c0 = useCounter(0, 400, statsInView);

  return (
    <div style={{ background: P.bg, color: P.text, minHeight: '100vh', fontFamily: 'inherit', overflowX: 'hidden' }}>

      {/* ── DECORATIVE BLOBS (parallax) ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <motion.div style={{ position: 'absolute', top: '-15%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,75,114,0.08) 0%, transparent 70%)', y: blob1Y }} />
        <motion.div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,75,114,0.06) 0%, transparent 70%)', y: blob2Y }} />
      </div>

      {/* ── HEADER ── */}
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
        style={{ position: 'fixed', top: 16, left: '50%', x: '-50%', width: 'calc(100% - 32px)', maxWidth: 1040, zIndex: 100 }}
      >
        <motion.header
          animate={{
            background: scrolled ? 'rgba(250,248,245,0.97)' : 'rgba(250,248,245,0.82)',
            boxShadow: scrolled ? '0 2px 32px rgba(0,0,0,0.1)' : '0 2px 16px rgba(0,0,0,0.04)',
          }}
          transition={{ duration: 0.35 }}
          style={{ backdropFilter: 'blur(20px)', border: `1px solid ${P.border}`, borderRadius: 999, padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${P.accent}, #e88faa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px rgba(200,75,114,0.35)`, overflow: 'hidden', padding: 2 }}>
              <img src="/logo-login.png" alt="Lash Agenda" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span className="hidden min-[380px]:inline" style={{ fontWeight: 800, fontSize: 17, background: `linear-gradient(135deg, ${P.accent}, #e88faa)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Lash Agenda</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <motion.button
              onClick={() => navigate('/cadastro')}
              whileHover={{ scale: 1.06, boxShadow: `0 6px 28px rgba(200,75,114,0.4)` }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING}
              style={{ background: P.accent, color: '#fff', border: 'none', borderRadius: 999, padding: '9px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Começar grátis <ArrowRight size={13} />
            </motion.button>
          </div>
        </motion.header>
      </motion.div>

      {/* ── HERO ── */}
      <section
        className="pt-[120px] lg:pt-[90px]"
        style={{ position: 'relative', zIndex: 1, minHeight: '100vh', paddingLeft: 20, paddingRight: 20, paddingBottom: 80, maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center' }}
      >
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 w-full">

          {/* Left — text */}
          <div className="flex-1 text-center lg:text-left">

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: EASE }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', background: P.accentLight, border: `1px solid rgba(200,75,114,0.22)`, borderRadius: 999, fontSize: 11, fontWeight: 700, color: P.accent, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 28 }}
            >
              ✦ Feito com carinho para Lash Designers Solo
            </motion.div>

            {/* Word-by-word title */}
            <motion.h1
              initial="hidden"
              animate="visible"
              variants={stagger(0.07, 0.5)}
              style={{ fontSize: 'clamp(34px, 4.2vw, 48px)', fontWeight: 900, lineHeight: 1.12, letterSpacing: -1.2, marginBottom: 20, color: P.text, textWrap: 'balance' } as any}
            >
              {heroWords.map((item, i) => (
                <motion.span
                  key={i}
                  variants={wordReveal}
                  style={{ display: 'inline-block', marginRight: '0.22em', color: item.a ? P.accent : 'inherit' }}
                >
                  {item.w}
                </motion.span>
              ))}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.7, ease: EASE }}
              style={{ fontSize: 16, color: P.muted, lineHeight: 1.8, marginBottom: 36, maxWidth: 520 }}
            >
              O Lash Agenda foi pensado para a Lash Designer que atende por conta própria. Agenda automática, ficha de cada cliente e controle dos seus ganhos — tudo num lugar só, sem nada que você não vai usar.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.6, ease: EASE }}
              className="grid sm:flex flex-wrap justify-center lg:justify-start"
              style={{ gap: 12, marginBottom: 32 }}
            >
              <motion.button
                onClick={() => navigate('/cadastro')}
                whileHover={{ scale: 1.05, boxShadow: `0 12px 40px rgba(200,75,114,0.45)` }}
                whileTap={{ scale: 0.97 }}
                transition={SPRING}
                style={{ background: P.accent, color: '#fff', border: 'none', borderRadius: 14, padding: '15px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 8px 32px rgba(200,75,114,0.35)` }}
              >
                Testar 7 dias grátis <ArrowRight size={16} />
              </motion.button>
              <Link
                to="/login"
                style={{ color: P.text, fontSize: 14, fontWeight: 600, textDecoration: 'none', padding: '15px 20px', background: 'rgba(255,255,255,0.85)', border: `1px solid rgba(200,75,114,0.25)`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
              >
                <LogIn size={16} /> Já tenho conta
              </Link>
            </motion.div>

            {/* Trust */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.7, duration: 0.5 }}
              className="flex flex-wrap justify-center lg:justify-start"
              style={{ gap: 20 }}
            >
              {[
                { icon: <Clock size={14} />, text: '7 dias grátis' },
                { icon: <CreditCard size={14} />, text: 'Sem cartão de crédito' },
                { icon: <ShieldCheck size={14} />, text: 'Garantia 7 dias' },
              ].map(b => (
                <span key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: P.text }}>
                  <span style={{ color: P.accent, display: 'flex' }}>{b.icon}</span> {b.text}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right — floating mockup */}
          <div className="w-full lg:w-auto lg:flex-shrink-0 flex justify-center min-h-[400px] lg:min-h-[320px]" style={{ position: 'relative' }}>

            {/* Decorative circles — hidden on mobile */}
            <motion.div
              className="hidden sm:block"
              animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', border: `2px dashed rgba(200,75,114,0.22)`, pointerEvents: 'none' }}
            />
            <motion.div
              className="hidden sm:block"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              style={{ position: 'absolute', bottom: 20, left: -30, width: 80, height: 80, borderRadius: '50%', background: P.accentLight, pointerEvents: 'none' }}
            />

            {/* Main mockup card — floats */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.8, ease: EASE }}
              className="max-w-[380px] lg:max-w-[300px]"
              style={{ width: '100%', position: 'relative', zIndex: 2 }}
            >
              <motion.div
                animate={{ y: [0, -16, 0], rotate: [-1, 1, -1] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 20, padding: 20, boxShadow: '0 32px 80px rgba(0,0,0,0.1)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${P.border}` }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: P.accent, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>App do Estúdio</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: P.text }}>Mari Lash Studio</div>
                  </div>
                  <motion.div
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}
                  />
                </div>

                <div style={{ background: P.accentLight, border: `1px solid rgba(200,75,114,0.15)`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: P.accent, marginBottom: 6 }}>✦ Volume Russo — R$ 180</div>
                  <div style={{ fontSize: 9, color: P.muted }}>Escolha a data e horário disponíveis</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  {[{ slot: 'Segunda — 09:00', selected: true }, { slot: 'Segunda — 11:00', selected: false }, { slot: 'Terça — 14:00', selected: false }].map((item, i) => (
                    <div key={i} style={{ background: item.selected ? P.accentLight : P.bg, border: `1px solid ${item.selected ? 'rgba(200,75,114,0.3)' : P.border}`, borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: item.selected ? 700 : 400, color: item.selected ? P.accent : P.muted }}>📅 {item.slot}</span>
                      {item.selected && <span style={{ width: 6, height: 6, borderRadius: '50%', background: P.accent, display: 'inline-block' }} />}
                    </div>
                  ))}
                </div>

                <button style={{ width: '100%', background: P.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 0', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  Confirmar agendamento
                </button>

                <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${P.border}`, fontSize: 9, color: P.faint, textAlign: 'center' }}>
                  Sua cliente agenda sozinha — você recebe o aviso na hora
                </div>
              </motion.div>
            </motion.div>

            {/* Floating notification chip */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.2, duration: 0.6, ease: EASE }}
              style={{ position: 'absolute', top: 10, left: 0, zIndex: 3, display: 'flex' }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 12, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
              >
                <Bell size={14} color={P.accent} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: P.text }}>Nova marcação!</div>
                  <div style={{ fontSize: 9, color: P.muted }}>Volume Russo • Segunda 09h</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── COUNTER STATS ── */}
      <motion.section
        ref={statsRef}
        style={{ position: 'relative', zIndex: 1, padding: 'clamp(36px, 6vw, 60px) 20px', background: P.accent }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-white"
            initial="hidden"
            animate={statsInView ? 'visible' : 'hidden'}
            variants={stagger(0.15)}
          >
            {[
              { value: `${c24}h`, label: 'Sua agenda aberta todo dia, o tempo todo' },
              { value: c3, label: 'Cliques pra sua cliente agendar' },
              { value: `R$${c0}`, label: 'De taxa sobre cada atendimento' },
            ].map((s, i) => (
              <motion.div key={i} variants={scaleIn}>
                <div style={{ fontSize: 'clamp(48px, 8vw, 72px)', fontWeight: 900, lineHeight: 1, marginBottom: 8 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 14, opacity: 0.85 }}>{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ── COMPARISON ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: 'clamp(44px, 8vw, 80px) 20px', background: '#f3f0eb' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger(0.08)}
            style={{ marginBottom: 48 }}
          >
            <motion.p variants={fadeUp} style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: P.accent, marginBottom: 12 }}>Por que o Lash Agenda é diferente</motion.p>
            <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(24px, 3.5vw, 42px)', fontWeight: 900, lineHeight: 1.15, letterSpacing: -0.5 }}>
              Por que usar sistemas <br className="hidden sm:block" />complicados de salão?
            </motion.h2>
            <motion.p variants={fadeUp} style={{ fontSize: 15, color: P.muted, maxWidth: 520, margin: '12px auto 0', lineHeight: 1.7 }}>
              Você não precisa de telas cheias de menu. Precisa de algo simples, feito sob medida pra quem atende sozinha.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left" style={{ position: 'relative' }}>

            {/* VS badge — desktop only, floats between the two cards */}
            <div
              className="hidden md:flex"
              style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10,
                width: 52, height: 52, borderRadius: '50%',
                background: `linear-gradient(135deg, ${P.accent}, #e88faa)`,
                alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 900, fontSize: 14, letterSpacing: 0.5,
                boxShadow: '0 10px 30px rgba(200,75,114,0.45)',
                border: '4px solid #f3f0eb',
              }}
            >
              VS
            </div>

            {/* Bad systems — slides from left */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.65, ease: EASE }}
              style={{ background: '#fff0f0', border: '1px solid #ffd0d0', borderRadius: 20, padding: 28 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <XCircle size={24} color="#dc2626" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#b91c1c', lineHeight: 1.3 }}>Sistemas Tradicionais</h3>
              </div>
              <motion.ul
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={stagger(0.07)}
                style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                {badPoints.map((p, i) => (
                  <motion.li key={i} variants={fadeUp} style={{ fontSize: 13, color: '#7f1d1d', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 26, height: 26, borderRadius: 8, background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {p.icon}
                    </span>
                    {p.text}
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>

            {/* Lash Agenda — slides from right */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.65, ease: EASE, delay: 0.1 }}
              whileHover={{ y: -4, boxShadow: `0 20px 60px rgba(200,75,114,0.15)`, transition: { type: 'spring', stiffness: 300 } }}
              style={{ background: P.accentLight, border: `2px solid ${P.accent}`, borderRadius: 20, padding: 28 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: P.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 6px 18px rgba(200,75,114,0.4)` }}>
                  <CheckCircle2 size={24} color="#fff" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: P.accent, lineHeight: 1.3 }}>Lash Agenda (Foco Solo)</h3>
              </div>
              <motion.ul
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={stagger(0.07, 0.05)}
                style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                {goodPoints.map((p, i) => (
                  <motion.li key={i} variants={fadeUp} style={{ fontSize: 13, color: P.accentDark, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
                    <span style={{ width: 26, height: 26, borderRadius: 8, background: P.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {p.icon}
                    </span>
                    {p.text}
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURES (bento grid) ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: 'clamp(44px, 8vw, 80px) 20px', background: P.accent }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger(0.08)}
            style={{ textAlign: 'center', marginBottom: 40 }}
          >
            <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(26px, 4vw, 48px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: -0.5, color: '#fff' }}>
              Tudo que você precisa.{' '}
              <span style={{ color: 'rgba(255,255,255,0.75)' }}>Exatamente do jeito que você precisa.</span>
            </motion.h2>
          </motion.div>

          {/* Row 1 */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.05 }}
            variants={stagger(0.1)}
          >
            {/* Big hero card */}
            <motion.div
              className="md:col-span-2"
              variants={fadeUp}
              whileHover={{ y: -6, boxShadow: '0 24px 60px rgba(0,0,0,0.16)' }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 20, padding: 36, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 240, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: P.accentLight, color: P.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={22} /></div>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: P.accent }}>Agenda online 24h</span>
                </div>
                <h3 style={{ fontSize: 'clamp(20px, 3vw, 32px)', fontWeight: 900, lineHeight: 1.2, marginBottom: 12, color: P.text }}>
                  Suas clientes agendam sozinhas.<br />A qualquer hora.
                </h3>
                <p style={{ fontSize: 14, color: P.muted, lineHeight: 1.7, maxWidth: 420 }}>
                  Elas acessam o link do seu estúdio, escolhem o serviço e o horário. Você recebe o aviso no celular na hora — sem precisar trocar nenhuma mensagem.
                </p>
              </div>
              <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {['Sem WhatsApp pra agendar', 'Aviso instantâneo no celular', 'Disponível de madrugada'].map(t => (
                  <span key={t} style={{ fontSize: 11, color: P.accent, background: P.accentLight, border: `1px solid rgba(200,75,114,0.2)`, borderRadius: 999, padding: '4px 12px', fontWeight: 600 }}>{t}</span>
                ))}
              </div>
            </motion.div>

            {/* Small card — aviso */}
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(0,0,0,0.12)' }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              <div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: P.accentLight, color: P.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><Bell size={20} /></div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: P.text }}>Aviso na hora</h3>
                <p style={{ fontSize: 13, color: P.muted, lineHeight: 1.6 }}>Notificação no celular assim que alguém agendar. Zero espera.</p>
              </div>
              <div style={{ marginTop: 20, fontSize: 32 }}>📲</div>
            </motion.div>
          </motion.div>

          {/* Row 2 */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.05 }}
            variants={stagger(0.1)}
          >
            {/* App clientes */}
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: P.accentLight, color: P.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><Sparkles size={20} /></div>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: P.text }}>App para as clientes</h3>
              <p style={{ fontSize: 13, color: P.muted, lineHeight: 1.6 }}>Elas salvam o link do seu estúdio no celular como ícone. Parece app — porque é. Mas sem baixar de loja.</p>
            </motion.div>

            {/* Ficha da cliente — card destaque */}
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -8, boxShadow: '0 28px 64px rgba(0,0,0,0.18)' }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              style={{ background: P.card, border: `2px solid ${P.accent}`, borderRadius: 20, padding: 28, position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
            >
              <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: P.accentLight, filter: 'blur(20px)' }} />
              <div style={{ width: 44, height: 44, borderRadius: 12, background: P.accentLight, color: P.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><BookOpen size={20} /></div>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: P.text }}>Ficha de cada cliente</h3>
              <p style={{ fontSize: 13, color: P.muted, lineHeight: 1.6, marginBottom: 16 }}>Curvatura, espessura, mapping, histórico. Tudo salvo e acessível na palma da sua mão.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[['Curvatura', 'D'], ['Espessura', '0.07'], ['Último atendimento', '28 dias']].map(([k, v]) => (
                  <div key={k} style={{ background: P.bg, borderRadius: 8, padding: '6px 10px', fontSize: 10, color: P.muted, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{k}</span>
                    <span style={{ color: P.accent, fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Bloqueio de horários */}
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: P.accentLight, color: P.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><Clock size={20} /></div>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: P.text }}>Bloqueio de horários</h3>
              <p style={{ fontSize: 13, color: P.muted, lineHeight: 1.6 }}>Folga, almoço, compromisso pessoal. Bloqueia e ninguém consegue agendar nesse período.</p>
            </motion.div>
          </motion.div>

          {/* Row 3 */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.05 }}
            variants={stagger(0.1)}
          >
            {/* Stat card — R$0 taxa */}
            <motion.div
              variants={scaleIn}
              whileHover={{ scale: 1.02, boxShadow: '0 24px 60px rgba(0,0,0,0.22)' }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              style={{ background: P.accentDark, borderRadius: 20, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
            >
              <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 8 }}>R$0</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)', fontWeight: 600, marginBottom: 4 }}>de taxa por atendimento</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Mensalidade fixa. O que você ganha é 100% seu.</div>
            </motion.div>

            {/* Ganhos card */}
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: P.accentLight, color: P.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><TrendingUp size={20} /></div>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: P.text }}>Controle dos seus ganhos</h3>
              <p style={{ fontSize: 13, color: P.muted, lineHeight: 1.6, marginBottom: 16 }}>Veja quanto faturou hoje, essa semana, esse mês. Sem planilha.</p>
              <div style={{ background: P.bg, borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 9, color: P.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Este mês</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: P.accent }}>R$ 4.320</div>
                <div style={{ fontSize: 9, color: '#10b981', marginTop: 4 }}>↑ 18% vs. mês anterior</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: 'clamp(44px, 8vw, 80px) 20px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={stagger(0.08)}
            style={{ marginBottom: 48 }}
          >
            <motion.p variants={fadeUp} style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: P.accent, marginBottom: 12 }}>Como funciona pra sua cliente</motion.p>
            <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(24px, 3.5vw, 42px)', fontWeight: 900, letterSpacing: -0.5 }}>
              Do link ao agendamento em 3 passos
            </motion.h2>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger(0.13)}
          >
            {steps.map((s, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(0,0,0,0.08)', transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, padding: 28, position: 'relative', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
              >
                <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 52, fontWeight: 900, color: 'rgba(200,75,114,0.08)', lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: P.accent, marginBottom: 14, lineHeight: 1 }}>{s.n}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: P.text }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: P.muted, lineHeight: 1.7 }}>{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: 'clamp(44px, 8vw, 80px) 20px', background: P.accent }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={fadeUp}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 900, letterSpacing: -0.5, color: '#fff' }}>O que dizem as Lash Designers</h2>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger(0.11)}
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                whileHover={{ y: -6, rotateZ: 0.4, boxShadow: '0 20px 50px rgba(0,0,0,0.08)', transition: { type: 'spring', stiffness: 300 } }}
                style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
              >
                <div style={{ color: P.accent, fontSize: 14, marginBottom: 14 }}>★★★★★</div>
                <p style={{ fontSize: 13, color: P.muted, lineHeight: 1.8, fontStyle: 'italic', marginBottom: 20 }}>"{t.text}"</p>
                <div style={{ paddingTop: 14, borderTop: `1px solid ${P.border}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: P.text }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: P.faint, marginTop: 2 }}>{t.role}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: 'clamp(44px, 8vw, 80px) 20px' }}>
        <div style={{ maxWidth: 740, margin: '0 auto', textAlign: 'center' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={stagger(0.08)}
            style={{ marginBottom: 48 }}
          >
            <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(24px, 3.5vw, 42px)', fontWeight: 900, letterSpacing: -0.5, marginBottom: 12 }}>Planos sem taxa por atendimento</motion.h2>
            <motion.p variants={fadeUp} style={{ fontSize: 14, color: P.muted }}>7 dias grátis pra testar. Sem precisar colocar cartão.</motion.p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger(0.14)}
          >
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -6, boxShadow: `0 24px 64px rgba(200,75,114,0.2)`, transition: { type: 'spring', stiffness: 260 } }}
              style={{ background: P.card, border: `2px solid ${P.accent}`, borderRadius: 20, padding: 28, position: 'relative', boxShadow: `0 8px 40px rgba(200,75,114,0.15)` }}
            >
              <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: P.accent, color: '#fff', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, padding: '4px 16px', borderRadius: 999, whiteSpace: 'nowrap' }}>Mais recomendado</div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: P.accent, marginBottom: 8 }}>Plano Agenda</div>
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 11, color: P.accent }}>R$ </span>
                <span style={{ fontSize: 40, fontWeight: 900, color: P.accent }}>69,90</span>
                <span style={{ fontSize: 11, color: P.muted }}>/mês</span>
              </div>
              <div style={{ paddingTop: 20, borderTop: `1px solid ${P.border}`, display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                {['Agendamento automático 24h', 'Portal online para suas clientes', 'Cadastro de Clientes e Serviços', 'Confirmação manual ou automática'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, color: P.text, fontWeight: 600 }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: P.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={14} color="#fff" />
                    </span>
                    {f}
                  </div>
                ))}
              </div>
              <motion.button
                onClick={() => navigate('/cadastro')}
                whileHover={{ scale: 1.02, boxShadow: `0 8px 32px rgba(200,75,114,0.45)` }} whileTap={{ scale: 0.98 }}
                style={{ width: '100%', padding: '12px 0', border: 'none', borderRadius: 12, background: P.accent, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Criar conta grátis
              </motion.button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              whileHover={{ y: -6, boxShadow: '0 20px 60px rgba(0,0,0,0.08)', transition: { type: 'spring', stiffness: 260 } }}
              style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 20, padding: 28, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: P.muted, marginBottom: 8 }}>Plano Premium</div>
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 11, color: P.muted }}>R$ </span>
                <span style={{ fontSize: 40, fontWeight: 900, color: P.text }}>99,90</span>
                <span style={{ fontSize: 11, color: P.muted }}>/mês</span>
              </div>
              <div style={{ paddingTop: 20, borderTop: `1px solid ${P.border}`, display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                {['Tudo do Plano Agenda', 'Relatórios e Análises do negócio', 'Fichas de Anamnese para Lash Designers', 'Suporte Prioritário'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, color: P.text, fontWeight: 500 }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: P.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={14} color={P.accent} />
                    </span>
                    {f}
                  </div>
                ))}
              </div>
              <motion.button
                onClick={() => navigate('/cadastro')}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ width: '100%', padding: '12px 0', border: `1px solid ${P.accent}`, borderRadius: 12, background: 'transparent', color: P.accent, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Criar conta grátis
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: 'clamp(44px, 8vw, 80px) 20px', background: P.accent }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={stagger(0.08)}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <motion.p variants={fadeUp} style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,255,255,0.8)', marginBottom: 12 }}>Ainda com dúvidas?</motion.p>
            <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(24px, 3.5vw, 42px)', fontWeight: 900, letterSpacing: -0.5, color: '#fff' }}>Perguntas frequentes</motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger(0.08)}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 16 }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 500, color: P.text }}>{faq.q}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      style={{ color: P.accent, flexShrink: 0, display: 'flex' }}
                    >
                      <ChevronDown size={18} />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: EASE }}
                        style={{ overflow: 'hidden' }}
                      >
                        <p style={{ fontSize: 13, color: P.muted, lineHeight: 1.8, padding: '0 22px 20px' }}>{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── GUARANTEE ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: 'clamp(36px, 6vw, 56px) 20px', textAlign: 'center', background: '#f3f0eb' }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={scaleIn}
          style={{ maxWidth: 540, margin: '0 auto' }}
        >
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <ShieldCheck size={24} color="#10b981" />
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, color: P.text }}>7 dias de garantia incondicional</h3>
          <p style={{ fontSize: 14, color: P.muted, lineHeight: 1.8 }}>
            Use na sua rotina real. Se em até 7 dias você achar que o Lash Agenda não ajudou no seu dia a dia, devolvemos seu dinheiro integralmente. Sem burocracia, sem pergunta.
          </p>
        </motion.div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: 'clamp(44px, 8vw, 80px) 20px', background: P.accent, textAlign: 'center' }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger(0.1)}
          style={{ maxWidth: 680, margin: '0 auto' }}
        >
          <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(26px, 4vw, 52px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: -1, marginBottom: 20, color: '#fff' }}>
            Chega de perder horário<br />respondendo WhatsApp.
          </motion.h2>
          <motion.p variants={fadeUp} style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 40, lineHeight: 1.7 }}>
            Deixa o Lash Agenda cuidar da agenda enquanto você cuida das clientes.
          </motion.p>
          <motion.div variants={fadeUp}>
            <motion.button
              onClick={() => navigate('/cadastro')}
              whileHover={{ scale: 1.05, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
              whileTap={{ scale: 0.97 }}
              transition={SPRING}
              style={{ background: '#fff', color: P.accent, border: 'none', borderRadius: 16, padding: '18px 40px', fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10, boxShadow: '0 16px 48px rgba(0,0,0,0.15)' }}
            >
              Criar conta grátis agora <ArrowRight size={18} />
            </motion.button>
            <p style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Sem cartão de crédito. Cancele quando quiser.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ position: 'relative', zIndex: 1, padding: '24px 20px', background: P.accentDark, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${P.accent}, #e88faa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <img src="/logo-login.png" alt="Lash Agenda" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 13, color: '#fff' }}>Lash Agenda</span>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>© {new Date().getFullYear()} Lash Agenda. Todos os direitos reservados.</p>
      </footer>

    </div>
  );
}
