import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import screen1 from '../assets/screen1.png';
import screen2 from '../assets/screen2.png';
import screen3 from '../assets/screen3.png';
import screen4 from '../assets/screen4.png';

const SCREENS = [screen1, screen2, screen3, screen4];
const SCREEN_LABELS = ['Meu Estúdio', 'Agendamentos', 'Agenda do Dia', 'Visão Geral'];
import {
  ArrowRight, Check, Bell, Calendar, BookOpen,
  TrendingUp, Clock, ShieldCheck, Sparkles,
} from 'lucide-react';

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
  hidden: { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE } },
};

const stagger = (delay = 0.09, delayChildren = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren: delay, delayChildren } },
});

// ── Palette ────────────────────────────────────────────────────────────────
const P = {
  bg: '#09090d',
  card: '#12121a',
  border: '#1e1e2e',
  accent: '#e91e8c',
  accentDim: 'rgba(233,30,140,0.1)',
  accentGlow: 'rgba(233,30,140,0.15)',
  text: '#f0f0f8',
  muted: '#7a7a90',
  faint: '#2a2a3a',
};

// ── Data ───────────────────────────────────────────────────────────────────
const heroLine1 = ['Lash', 'Designer', 'merece', 'mais', 'que'];
const heroLine2 = ['WhatsApp', 'e', 'planilha.'];

const features = [
  { icon: <Calendar size={18} />, title: 'Agenda aberta 24h', desc: 'Suas clientes agendam sozinhas pelo link do seu estúdio — de madrugada, de domingo, quando quiserem.' },
  { icon: <Bell size={18} />, title: 'Aviso no celular na hora', desc: 'Você recebe uma notificação assim que alguém agendar. Sem precisar ficar verificando o WhatsApp.' },
  { icon: <BookOpen size={18} />, title: 'Ficha de cada cliente', desc: 'Curvatura, espessura, mapping e histórico de atendimentos. Tudo salvo e na palma da sua mão.' },
  { icon: <TrendingUp size={18} />, title: 'Controle dos seus ganhos', desc: 'Veja quanto faturou hoje, essa semana e esse mês. Simples, sem planilha, sem complicação.' },
  { icon: <Clock size={18} />, title: 'Bloqueio de horários', desc: 'Folga, almoço, compromisso pessoal? Bloqueia e ninguém consegue agendar nesse período.' },
  { icon: <Sparkles size={18} />, title: 'App para as suas clientes', desc: 'Elas salvam o link do seu estúdio como ícone no celular. Parece um app, mas não precisa baixar de loja nenhuma.' },
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

const pains = [
  '📱 Responde agendamentos às 23h pelo WhatsApp',
  '📓 Anota horários em papel ou no bloco de notas',
  '😤 Perde clientes por não responder a tempo',
  '🤯 Não sabe exatamente quanto faturou esse mês',
  '📵 Para o atendimento pra responder mensagem',
  '😰 Não lembra a curvatura da última vez da cliente',
];

// ── Component ──────────────────────────────────────────────────────────────
export default function LandingPage_v5() {
  const navigate = useNavigate();
  const { scrollY, scrollYProgress } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [activeScreen, setActiveScreen] = useState(0);
  const [direction, setDirection] = useState(1);

  // Header darkens on scroll
  useEffect(() => {
    return scrollY.on('change', (v) => setScrolled(v > 80));
  }, [scrollY]);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setActiveScreen(prev => (prev + 1) % SCREENS.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  // Parallax for ambient orbs
  const orb1Y = useTransform(scrollYProgress, [0, 1], ['0%', '-40%']);
  const orb2Y = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);

  return (
    <div style={{ background: P.bg, color: P.text, minHeight: '100vh', fontFamily: 'inherit', overflowX: 'hidden' }}>

      {/* ── AMBIENT (parallax orbs) ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <motion.div style={{ position: 'absolute', top: '-5%', left: '10%', width: 700, height: 700, borderRadius: '50%', background: `radial-gradient(circle, ${P.accentGlow} 0%, transparent 70%)`, filter: 'blur(60px)', y: orb1Y }} />
        <motion.div style={{ position: 'absolute', bottom: '5%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(233,30,140,0.07) 0%, transparent 70%)', filter: 'blur(80px)', y: orb2Y }} />
        {/* Dot grid texture */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
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
            background: scrolled ? 'rgba(9,9,13,0.96)' : 'rgba(9,9,13,0.72)',
            boxShadow: scrolled ? '0 1px 40px rgba(0,0,0,0.6)' : 'none',
          }}
          transition={{ duration: 0.35 }}
          style={{ backdropFilter: 'blur(24px)', border: `1px solid ${P.border}`, borderRadius: 999, padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${P.accent}, #ff8cc8)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11, color: '#fff' }}>LA</div>
            <span className="hidden min-[380px]:inline" style={{ fontWeight: 800, fontSize: 17, background: `linear-gradient(135deg, ${P.accent}, #ff8cc8)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Lash Agenda</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/login" style={{ color: P.muted, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Entrar</Link>
            <motion.button
              onClick={() => navigate('/cadastro')}
              whileHover={{ scale: 1.06, boxShadow: `0 0 32px rgba(233,30,140,0.55)` }}
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
      <section style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '130px 20px 80px' }}>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.3 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: P.accentDim, border: `1px solid rgba(233,30,140,0.28)`, borderRadius: 999, fontSize: 11, fontWeight: 700, color: P.accent, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 32 }}
        >
          ✦ Feito só pra Lash Designer
        </motion.div>

        {/* Word-by-word animated title */}
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={stagger(0.07, 0.5)}
          style={{ fontSize: 'clamp(36px, 6.5vw, 78px)', fontWeight: 900, lineHeight: 1.06, letterSpacing: -2, marginBottom: 24, maxWidth: 920 }}
        >
          {heroLine1.map((word, i) => (
            <motion.span key={i} variants={wordReveal} style={{ display: 'inline-block', marginRight: '0.22em' }}>
              {word}
            </motion.span>
          ))}
          <br className="hidden sm:block" />
          {heroLine2.map((word, i) => (
            <motion.span
              key={`p${i}`}
              variants={wordReveal}
              style={{
                display: 'inline-block', marginRight: '0.22em',
                background: `linear-gradient(135deg, ${P.accent}, #ff8cc8)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.7, ease: EASE }}
          style={{ fontSize: 16, color: P.muted, maxWidth: 560, lineHeight: 1.8, marginBottom: 40 }}
        >
          O Lash Agenda foi pensado pra quem atende cílios por conta própria. Agenda automática, ficha de cada cliente e controle dos seus ganhos — tudo num lugar só, sem a bagunça de sistema de salão.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.6, ease: EASE }}
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 40 }}
        >
          <motion.button
            onClick={() => navigate('/cadastro')}
            whileHover={{ scale: 1.05, boxShadow: `0 16px 56px rgba(233,30,140,0.55)` }}
            whileTap={{ scale: 0.97 }}
            transition={SPRING}
            style={{ background: P.accent, color: '#fff', border: 'none', borderRadius: 14, padding: '15px 32px', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: `0 10px 40px rgba(233,30,140,0.35)` }}
          >
            Testar 7 dias de graça <ArrowRight size={16} />
          </motion.button>
          <Link to="/login" style={{ color: P.muted, fontSize: 14, fontWeight: 500, textDecoration: 'none', padding: '15px 24px', border: `1px solid ${P.border}`, borderRadius: 14, display: 'flex', alignItems: 'center' }}>
            Já tenho conta
          </Link>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}
        >
          {['7 dias grátis', 'Sem cartão de crédito', 'Garantia de 7 dias'].map(b => (
            <span key={b} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: P.muted }}>
              <Check size={13} color={P.accent} /> {b}
            </span>
          ))}
        </motion.div>

        {/* Phone carousel */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.9, ease: EASE }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}
        >
          {/* Phone frame */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 260,
              height: 520,
              borderRadius: 40,
              background: '#0e0e16',
              border: '2px solid rgba(233,30,140,0.35)',
              boxShadow: `0 0 0 6px rgba(233,30,140,0.07), 0 40px 80px rgba(0,0,0,0.7), 0 0 60px rgba(233,30,140,0.12)`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Notch */}
            <div style={{
              position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
              width: 80, height: 22, background: '#0e0e16',
              borderRadius: 12, zIndex: 10,
              border: '1.5px solid rgba(233,30,140,0.2)',
            }} />

            {/* Sliding screens */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: 38, overflow: 'hidden' }}>
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.img
                  key={activeScreen}
                  src={SCREENS[activeScreen]}
                  alt={SCREEN_LABELS[activeScreen]}
                  custom={direction}
                  initial={{ x: direction * 260, opacity: 0.6 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: direction * -260, opacity: 0.6 }}
                  transition={{ duration: 0.55, ease: EASE }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
                />
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: 8 }}>
            {SCREENS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > activeScreen ? 1 : -1); setActiveScreen(i); }}
                style={{
                  width: i === activeScreen ? 24 : 8,
                  height: 8,
                  borderRadius: 999,
                  background: i === activeScreen ? P.accent : P.border,
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.35s ease',
                }}
              />
            ))}
          </div>

          {/* Label */}
          <motion.p
            key={activeScreen}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ fontSize: 12, color: P.muted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}
          >
            {SCREEN_LABELS[activeScreen]}
          </motion.p>
        </motion.div>
      </section>

      {/* ── PAIN STRIP ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '48px 20px', background: 'rgba(233,30,140,0.03)', borderTop: `1px solid ${P.border}`, borderBottom: `1px solid ${P.border}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: P.accent, marginBottom: 20 }}
          >
            Soa familiar?
          </motion.p>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger(0.07)}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}
          >
            {pains.map((p, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 999, padding: '8px 16px', fontSize: 12, color: P.muted }}
              >
                {p}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 20px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger(0.08)}
            style={{ textAlign: 'center', marginBottom: 56 }}
          >
            <motion.p variants={fadeUp} style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: P.accent, marginBottom: 12 }}>
              O que tem no Lash Agenda
            </motion.p>
            <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(26px, 4vw, 48px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: -1 }}>
              Tudo pra Lash Designer.{' '}
              <span style={{ color: P.muted, fontWeight: 400, fontStyle: 'italic' }}>Nada que você não vai usar.</span>
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.05 }}
            variants={stagger(0.09)}
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -8, borderColor: 'rgba(233,30,140,0.45)', boxShadow: '0 24px 60px rgba(233,30,140,0.16)' }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, padding: 24, cursor: 'default' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: P.accentDim, color: P.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: P.muted, lineHeight: 1.7 }}>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 20px', background: 'rgba(233,30,140,0.03)', borderTop: `1px solid ${P.border}`, borderBottom: `1px solid ${P.border}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={stagger(0.08)}
            style={{ marginBottom: 56 }}
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
                whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, padding: 28, position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 52, fontWeight: 900, color: 'rgba(233,30,140,0.05)', lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: P.accent, marginBottom: 14, lineHeight: 1 }}>{s.n}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: P.muted, lineHeight: 1.7 }}>{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 20px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={fadeUp}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 42px)', fontWeight: 900, letterSpacing: -0.5 }}>O que dizem as Lash Designers</h2>
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
                whileHover={{ y: -6, rotateZ: 0.4, boxShadow: '0 24px 60px rgba(0,0,0,0.35)', transition: { type: 'spring', stiffness: 300 } }}
                style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, padding: 24 }}
              >
                <div style={{ color: P.accent, fontSize: 14, marginBottom: 14 }}>★★★★★</div>
                <p style={{ fontSize: 13, color: P.muted, lineHeight: 1.8, fontStyle: 'italic', marginBottom: 20 }}>"{t.text}"</p>
                <div style={{ paddingTop: 14, borderTop: `1px solid ${P.border}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>{t.role}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 20px', background: 'rgba(233,30,140,0.03)', borderTop: `1px solid ${P.border}` }}>
        <div style={{ maxWidth: 740, margin: '0 auto', textAlign: 'center' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={stagger(0.08)}
            style={{ marginBottom: 48 }}
          >
            <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(24px, 3.5vw, 42px)', fontWeight: 900, letterSpacing: -0.5, marginBottom: 12 }}>
              Planos sem taxa por atendimento
            </motion.h2>
            <motion.p variants={fadeUp} style={{ fontSize: 14, color: P.muted }}>Teste 7 dias grátis. Sem precisar cadastrar cartão.</motion.p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger(0.14)}
          >
            <motion.div variants={fadeUp} style={{ background: P.card, border: `2px solid ${P.accent}`, borderRadius: 20, padding: 28, position: 'relative', boxShadow: `0 0 48px rgba(233,30,140,0.1)` }}>
              <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: P.accent, color: '#fff', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, padding: '4px 16px', borderRadius: 999, whiteSpace: 'nowrap' }}>Mais recomendado</div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: P.accent, marginBottom: 8 }}>Plano Agenda</div>
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 11, color: P.accent }}>R$ </span>
                <span style={{ fontSize: 40, fontWeight: 900, color: P.accent }}>69,90</span>
                <span style={{ fontSize: 11, color: P.muted }}>/mês</span>
              </div>
              <div style={{ paddingTop: 20, borderTop: `1px solid ${P.border}`, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {['Agendamento automático 24h', 'Portal online para suas clientes', 'Cadastro de Clientes e Serviços', 'Confirmação manual ou automática'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <Check size={14} color={P.accent} /> {f}
                  </div>
                ))}
              </div>
              <motion.button
                onClick={() => navigate('/cadastro')}
                whileHover={{ scale: 1.02, boxShadow: `0 8px 36px rgba(233,30,140,0.55)` }}
                whileTap={{ scale: 0.98 }}
                style={{ width: '100%', padding: '12px 0', border: 'none', borderRadius: 12, background: P.accent, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Criar conta grátis
              </motion.button>
            </motion.div>

            <motion.div variants={fadeUp} style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 20, padding: 28 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: P.muted, marginBottom: 8 }}>Plano Premium</div>
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 11, color: P.muted }}>R$ </span>
                <span style={{ fontSize: 40, fontWeight: 900 }}>99,90</span>
                <span style={{ fontSize: 11, color: P.muted }}>/mês</span>
              </div>
              <div style={{ paddingTop: 20, borderTop: `1px solid ${P.border}`, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {['Tudo do Plano Agenda', 'Relatórios e Análises do negócio', 'Fichas de Anamnese para Lash Designers', 'Suporte Prioritário'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: P.muted }}>
                    <Check size={14} color={P.accent} /> {f}
                  </div>
                ))}
              </div>
              <motion.button
                onClick={() => navigate('/cadastro')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ width: '100%', padding: '12px 0', border: `1px solid rgba(233,30,140,0.4)`, borderRadius: 12, background: 'transparent', color: P.accent, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Criar conta grátis
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── GUARANTEE ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '64px 20px', textAlign: 'center' }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={scaleIn}
          style={{ maxWidth: 560, margin: '0 auto' }}
        >
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <ShieldCheck size={24} color="#10b981" />
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>7 dias de garantia incondicional</h3>
          <p style={{ fontSize: 14, color: P.muted, lineHeight: 1.8 }}>
            Use na sua rotina. Se em até 7 dias você achar que o Lash Agenda não ajudou no seu dia a dia, devolvemos seu dinheiro integralmente, sem burocracia.
          </p>
        </motion.div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 20px', background: `linear-gradient(135deg, rgba(233,30,140,0.12), rgba(233,30,140,0.04))`, borderTop: `1px solid ${P.border}`, textAlign: 'center' }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger(0.1)}
          style={{ maxWidth: 700, margin: '0 auto' }}
        >
          <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(28px, 4.5vw, 58px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: -1.5, marginBottom: 20 }}>
            Seu estúdio não para.<br />
            <span style={{ color: P.accent }}>Sua agenda também não deveria.</span>
          </motion.h2>
          <motion.p variants={fadeUp} style={{ fontSize: 15, color: P.muted, marginBottom: 40, lineHeight: 1.7 }}>
            Chega de perder tempo com mensagem pra marcar horário. Deixa o Lash Agenda trabalhar enquanto você atende.
          </motion.p>
          <motion.div variants={fadeUp}>
            <motion.button
              onClick={() => navigate('/cadastro')}
              whileHover={{ scale: 1.05, boxShadow: `0 20px 64px rgba(233,30,140,0.6)` }}
              whileTap={{ scale: 0.97 }}
              transition={SPRING}
              style={{ background: P.accent, color: '#fff', border: 'none', borderRadius: 16, padding: '18px 40px', fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10, boxShadow: `0 16px 48px rgba(233,30,140,0.4)` }}
            >
              Começar agora, é grátis <ArrowRight size={18} />
            </motion.button>
            <p style={{ marginTop: 16, fontSize: 12, color: P.faint }}>Sem cartão. Cancele quando quiser.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ position: 'relative', zIndex: 1, padding: '32px 20px', borderTop: `1px solid ${P.border}`, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: `linear-gradient(135deg, ${P.accent}, #ff8cc8)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#fff' }}>LA</div>
          <span style={{ fontWeight: 800, fontSize: 14, background: `linear-gradient(135deg, ${P.accent}, #ff8cc8)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Lash Agenda</span>
        </div>
        <p style={{ fontSize: 11, color: P.faint }}>© {new Date().getFullYear()} Lash Agenda. Todos os direitos reservados.</p>
        <div style={{ marginTop: 12, display: 'flex', gap: 16, justifyContent: 'center' }}>
          <Link to="/login" style={{ fontSize: 11, color: P.faint, textDecoration: 'none' }}>Login</Link>
          <span style={{ color: P.faint }}>•</span>
          <Link to="/cadastro" style={{ fontSize: 11, color: P.faint, textDecoration: 'none' }}>Cadastro</Link>
        </div>
      </footer>

    </div>
  );
}
