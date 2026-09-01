import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Navigate } from 'react-router-dom';
import { X, PlayCircle } from 'lucide-react';
import { FEATURES } from '../../config/features';

type Tutorial = {
  id: string;
  title: string;
  vimeoId: string;
  vimeoHash: string;
};

type Category = {
  id: string;
  title: string;
  tutorials: Tutorial[];
};

const V = { vimeoId: '1207680718', vimeoHash: '97fd933d25' };

const CATEGORIES: Category[] = [
  {
    id: 'primeiros-passos',
    title: 'Primeiros Passos',
    tutorials: [
      { id: 'visao-geral', title: 'Visão geral do sistema', ...V },
      { id: 'como-comecar', title: 'Como começar a usar o Lash Agenda', ...V },
    ],
  },
  {
    id: 'dashboard',
    title: 'Painel Inicial',
    tutorials: [
      { id: 'dashboard-intro', title: 'Entendendo o painel inicial', ...V },
      { id: 'dashboard-kpis', title: 'Como interpretar os indicadores', ...V },
    ],
  },
  {
    id: 'clientes',
    title: 'Clientes',
    tutorials: [
      { id: 'clientes-cadastro', title: 'Como cadastrar uma cliente', ...V },
      { id: 'clientes-ficha', title: 'Preenchendo a ficha clínica', ...V },
      { id: 'clientes-historico', title: 'Visualizando o histórico de atendimentos', ...V },
    ],
  },
  {
    id: 'servicos',
    title: 'Serviços',
    tutorials: [
      { id: 'servicos-cadastro', title: 'Cadastrando um serviço', ...V },
      { id: 'servicos-categorias', title: 'Organizando por categorias', ...V },
    ],
  },
  {
    id: 'agenda',
    title: 'Agenda',
    tutorials: [
      { id: 'agenda-novo', title: 'Criando um agendamento', ...V },
      { id: 'agenda-bloqueio', title: 'Bloqueando horários', ...V },
      { id: 'agenda-horarios', title: 'Configurando seus horários de atendimento', ...V },
    ],
  },
  {
    id: 'configuracoes',
    title: 'Configurações',
    tutorials: [
      { id: 'config-estudio', title: 'Configurando seu estúdio', ...V },
      { id: 'config-portal', title: 'Personalizando o portal das clientes', ...V },
      { id: 'config-link', title: 'Compartilhando seu link de agendamento', ...V },
    ],
  },
];

export default function Tutoriais() {
  const [activeVideo, setActiveVideo] = useState<Tutorial | null>(null);

  if (!FEATURES.tutoriais) return <Navigate to="/meu-estudio" replace />;

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, var(--rose-600) 75%, var(--rose-400) 100%)' }}>
        <div className="absolute top-4 right-5 text-white/40 pointer-events-none select-none leading-none text-lg font-light">
          ✦<br /><span className="text-sm">✦</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <PlayCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-title font-bold text-2xl">Tutoriais</h1>
            <p className="text-sm text-white/75 mt-0.5">
              Aprenda a usar cada funcionalidade com vídeos curtos e objetivos.
            </p>
          </div>
        </div>
      </div>

      {/* Categories */}
      {CATEGORIES.map((cat) => (
        <section key={cat.id}>
          <h2 className="font-sans font-semibold text-base text-text-primary mb-3 px-0.5">
            {cat.title}
          </h2>
          <div
            className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:-mx-0 md:px-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
          >
            {cat.tutorials.map((tutorial) => (
              <VideoCard
                key={tutorial.id}
                tutorial={tutorial}
                onClick={() => setActiveVideo(tutorial)}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Video Modal */}
      {activeVideo && (
        <VideoModal tutorial={activeVideo} onClose={() => setActiveVideo(null)} />
      )}
    </div>
  );
}

function VideoCard({ tutorial, onClick }: { tutorial: Tutorial; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-[140px] group cursor-pointer text-left"
    >
      {/* Thumbnail */}
      <div
        className="relative w-[140px] rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-all group-hover:scale-[1.02]"
        style={{ aspectRatio: '9 / 16', background: 'linear-gradient(to bottom right, var(--rose-600), var(--rose-400))' }}
      >
        {/* Decorative rings */}
        <div className="absolute top-4 right-4 w-14 h-14 rounded-full border border-white/25 pointer-events-none" />
        <div className="absolute bottom-8 left-3 w-8 h-8 rounded-full border border-white/20 pointer-events-none" />

        {/* Logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img src="/logo-login.png" alt="Lash Agenda" className="w-14 h-14 object-contain opacity-85" />
        </div>

        {/* Play button — sempre visível, ganha destaque no hover */}
        <div className="absolute bottom-3 inset-x-0 flex justify-center">
          <div className="w-9 h-9 rounded-full bg-white/80 group-hover:bg-white flex items-center justify-center shadow-md transition-all group-hover:scale-110">
            <PlayCircle className="w-5 h-5 text-rose-600" />
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors rounded-xl" />
      </div>

      {/* Title */}
      <p className="font-title font-semibold text-[13px] text-text-primary mt-2 leading-snug line-clamp-2 px-0.5 min-h-[2.5rem]">
        {tutorial.title}
      </p>
    </button>
  );
}

function VideoModal({ tutorial, onClose }: { tutorial: Tutorial; onClose: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="flex flex-col items-center gap-3 w-full mx-auto px-4 pt-4 pb-4 md:max-w-[300px] md:px-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between w-full">
          <p className="text-white font-semibold text-sm leading-snug flex-1 mr-3 line-clamp-2">
            {tutorial.title}
          </p>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player */}
        <div
          className="relative rounded-2xl overflow-hidden bg-black shadow-2xl mx-auto w-auto max-w-full h-[calc(100dvh-120px)] md:h-auto md:w-full md:max-w-[240px]"
          style={{ aspectRatio: '9 / 16' }}
        >
          <iframe
            src={`https://player.vimeo.com/video/${tutorial.vimeoId}?h=${tutorial.vimeoHash}&badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1`}
            className="absolute inset-0 w-full h-full"
            frameBorder={0}
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
            allowFullScreen
            title={tutorial.title}
          />
        </div>

      </div>
    </div>,
    document.body
  );
}
