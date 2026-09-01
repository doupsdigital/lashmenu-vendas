import { useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuth } from '../contexts/AuthContext';

export type OnboardingPageKey =
  | 'meu_estudio'
  | 'agendamentos'
  | 'clientes'
  | 'servicos'
  | 'meus_horarios'
  | 'relatorios'
  | 'link_agendamento'
  | 'configuracoes'
  | 'fichas_anamnese'
  | 'portal_catalogo'
  | 'portal_catalogo_anonimo'
  | 'portal_agendar'
  | 'portal_agendamentos'
  | 'portal_perfil';

import type { DriveStep } from 'driver.js';

// Passo final "Menu principal": no mobile o menu é a TabBar inferior, no
// desktop é a Sidebar lateral — os dois existem sempre no DOM, só um fica
// visível por vez (o outro fica com display:none via CSS responsivo), então
// escolhemos em tempo real qual dos dois destacar.
const menuPrincipalElement = (): Element =>
  (window.innerWidth < 768
    ? document.querySelector('#onboarding-tabbar')
    : document.querySelector('#onboarding-menu-sidebar')) as Element;

const MENU_PRINCIPAL_STEP: DriveStep = {
  element: menuPrincipalElement,
  popover: {
    title: 'Menu principal',
    description: 'Pelo menu você acessa as principais áreas do sistema: Início, Agendamentos, Clientes, Serviços, Configurações e mais.',
  },
};

// Mesmo caso do menu principal acima: no portal da cliente, o menu mobile
// (barra inferior) e o desktop (nav horizontal) existem os dois sempre no
// DOM, só um visível por vez via CSS responsivo.
const portalNavElement = (): Element =>
  (window.innerWidth < 768
    ? document.querySelector('#ob-portal-nav')
    : document.querySelector('#ob-portal-nav-desktop')) as Element;

// "Meu Estúdio" (Dashboard) muda bastante de layout entre os planos — no
// Agenda ela vê um resumo simples; no Premium, KPIs completos, ações rápidas
// e gráfico de receita. Por isso são dois roteiros separados (ver useOnboarding).
const MEU_ESTUDIO_STEPS_PREMIUM: DriveStep[] = [
  {
    popover: {
      title: 'Bem-vinda ao Lash Agenda! 👋',
      description: 'Vamos te mostrar rapidinho como o sistema funciona. São só alguns passos e você já estará pronta para usar tudo. Pode pular a qualquer momento.',
      side: 'over' as any, align: 'center',
    },
  },
  {
    element: '#onboarding-card-faturamento',
    popover: {
      title: 'Faturamento do mês 💰',
      description: 'Aqui você acompanha quanto ganhou no mês com atendimentos finalizados. O valor atualiza automaticamente conforme você conclui atendimentos.',
    },
  },
  {
    element: '#onboarding-card-hoje',
    popover: {
      title: 'Agendamentos de hoje 📅',
      description: 'Quantos atendimentos você tem marcados para hoje. Clique no card para ir direto à agenda do dia.',
    },
  },
  {
    element: '#onboarding-card-pendentes',
    popover: {
      title: 'Confirmações pendentes ⏳',
      description: 'Quando sua cliente agendar pelo portal, o agendamento fica aqui até você confirmar. Não deixe acumular!',
    },
  },
  {
    element: '#onboarding-card-clientes',
    popover: {
      title: 'Novas clientes 🌟',
      description: 'Quantas clientes novas se cadastraram no mês. Acompanhe seu crescimento por aqui.',
    },
  },
  {
    element: '#onboarding-share-link',
    popover: {
      title: 'Compartilhe sua agenda 🔗',
      description: 'Copie o link do seu portal exclusivo e envie para suas clientes agendarem sozinhas, a qualquer hora — sem precisar te chamar no WhatsApp.',
    },
  },
  {
    element: '#onboarding-btn-novo-agendamento',
    popover: {
      title: 'Criar agendamento rápido',
      description: 'Use este botão para adicionar um agendamento manualmente — quando a cliente liga ou manda mensagem pedindo um horário.',
    },
  },
  {
    element: '#onboarding-btn-bloquear',
    popover: {
      title: 'Bloquear horário',
      description: 'Precisa sair mais cedo ou tem um compromisso? Bloqueie o horário para que suas clientes não consigam agendar nesse período.',
    },
  },
  {
    element: '#onboarding-btn-novo-servico',
    popover: {
      title: 'Seus serviços',
      description: 'Cadastre aqui todos os seus serviços com preço e duração. Eles aparecem no portal para suas clientes escolherem na hora de agendar.',
    },
  },
  {
    element: '#onboarding-btn-agenda-dia',
    popover: {
      title: 'Agenda do dia',
      description: 'Veja todos os seus horários de hoje de forma organizada, com nome da cliente, serviço e status.',
    },
  },
  {
    element: '#onboarding-proximas-clientes',
    popover: {
      title: 'Próximas clientes',
      description: 'Veja quem está agendada a seguir, com nome, serviço e status. Toque no ícone de informação para entender cada status.',
    },
  },
  MENU_PRINCIPAL_STEP,
  {
    popover: {
      title: 'Tudo pronto! 🎉',
      description: 'Você já conhece o essencial do Lash Agenda. Agora é só começar a usar. Qualquer dúvida, clique em Ajuda em qualquer tela.',
      side: 'over' as any, align: 'center',
    },
  },
];

const MEU_ESTUDIO_STEPS_BASICO: DriveStep[] = [
  {
    popover: {
      title: 'Bem-vinda ao Lash Agenda! 👋',
      description: 'Vamos te mostrar rapidinho como o sistema funciona. São só alguns passos e você já estará pronta para usar tudo. Pode pular a qualquer momento.',
      side: 'over' as any, align: 'center',
    },
  },
  {
    element: '#onboarding-card-hoje',
    popover: {
      title: 'Confirmações pendentes ⏳',
      description: 'Quando sua cliente agendar pelo portal, o agendamento fica aqui até você confirmar. Não deixe acumular!',
    },
  },
  {
    element: '#onboarding-card-faturamento',
    popover: {
      title: 'Faturamento de hoje 💰',
      description: 'Aqui você acompanha quanto já ganhou hoje com atendimentos finalizados.',
    },
  },
  {
    element: '#onboarding-share-link',
    popover: {
      title: 'Compartilhe sua agenda 🔗',
      description: 'Copie o link do seu portal exclusivo e envie para suas clientes agendarem sozinhas, a qualquer hora — sem precisar te chamar no WhatsApp.',
    },
  },
  {
    element: '#onboarding-proximas-clientes',
    popover: {
      title: 'Próximas clientes',
      description: 'Veja quem está agendada a seguir, com nome, serviço e status. Toque no ícone de informação para entender cada status.',
    },
  },
  MENU_PRINCIPAL_STEP,
  {
    popover: {
      title: 'Tudo pronto! 🎉',
      description: 'Você já conhece o essencial do Lash Agenda. Relatórios, fichas de anamnese e ações rápidas do painel fazem parte do plano Premium — conheça em "Minha Assinatura". Qualquer dúvida, clique em Ajuda em qualquer tela.',
      side: 'over' as any, align: 'center',
    },
  },
];

const STEPS: Record<Exclude<OnboardingPageKey, 'meu_estudio'>, DriveStep[]> & { meu_estudio: DriveStep[] } = {
  meu_estudio: MEU_ESTUDIO_STEPS_PREMIUM,

  agendamentos: [
    {
      popover: {
        title: 'Sua agenda 📆',
        description: 'Aqui fica toda a sua agenda de atendimentos. Você pode ver por dia, semana ou mês.',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-agend-novo-btn',
      popover: {
        title: 'Novo agendamento',
        description: 'Cria um novo horário para uma cliente. Você escolhe a cliente, o serviço, a data e o horário.',
      },
    },
    {
      element: '#ob-agend-view-toggle',
      popover: {
        title: 'Modos de visualização',
        description: 'Alterne entre visualização mensal, semanal e diária. No celular, o modo diário é o mais prático para o dia a dia.',
      },
    },
    {
      element: '#ob-agend-pendentes',
      popover: {
        title: 'Aguardando confirmação',
        description: 'Agendamentos feitos pelo portal que precisam da sua aprovação aparecem aqui. Confirme ou recuse com um clique.',
      },
    },
    {
      element: '#ob-agend-grid',
      popover: {
        title: 'Grade de horários',
        description: 'Clique em qualquer horário disponível para criar um agendamento rapidamente. Horários bloqueados aparecem em cinza.',
      },
    },
  ],

  clientes: [
    {
      popover: {
        title: 'Suas clientes 👩',
        description: 'Aqui você gerencia toda a sua base de clientes — dados pessoais e histórico de agendamentos.',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-clientes-add-btn',
      popover: {
        title: 'Cadastrar cliente',
        description: 'Adicione uma nova cliente manualmente com nome e WhatsApp — e-mail, data de nascimento, CPF e endereço são opcionais e podem ser preenchidos depois.',
      },
    },
    {
      element: '#ob-clientes-search',
      popover: {
        title: 'Busca rápida',
        description: 'Encontre qualquer cliente pelo nome ou número de WhatsApp. Útil quando a agenda está movimentada.',
      },
    },
    {
      element: '#ob-clientes-lista',
      popover: {
        title: 'Lista de clientes',
        description: 'Clique em qualquer cliente para ver o perfil completo, histórico de atendimentos e agendar um novo horário. Clientes que agendarem pelo seu link também aparecem aqui automaticamente.',
      },
    },
  ],

  servicos: [
    {
      popover: {
        title: 'Seus serviços 💅',
        description: 'Aqui você cadastra e organiza todos os serviços que oferece. Já deixamos alguns serviços pré-cadastrados com imagens para te dar uma base — fique à vontade para editar nomes, preços e durações conforme a sua realidade. Se preferir usar fotos suas no lugar das imagens padrão, é só substituir em cada serviço.',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-servico-form',
      popover: {
        title: 'Novo serviço',
        description: 'Cadastre um serviço com nome, preço e duração. Se quiser, expanda "Adicionar mais detalhes" para incluir descrição e uma foto ilustrativa.',
      },
    },
    {
      element: '#ob-servicos-lista',
      popover: {
        title: 'Lista de serviços',
        description: 'Clique no lápis para editar e na lixeira para excluir um serviço.',
      },
    },
  ],

  meus_horarios: [
    {
      popover: {
        title: 'Meus horários ⏰',
        description: 'Configure os dias e horários em que você atende. Suas clientes só conseguirão agendar nos horários que você liberar aqui.',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-horarios-grid',
      popover: {
        title: 'Dias de atendimento',
        description: 'Ative os dias que você trabalha e defina o horário de início e fim de cada um. Você pode ter horários diferentes por dia da semana.',
      },
    },
    {
      element: '#ob-horarios-bloqueios',
      popover: {
        title: 'Bloqueios de agenda',
        description: 'Use os bloqueios para marcar períodos em que você não atende — férias, feriados ou compromissos pessoais. As clientes não conseguirão agendar nesses períodos.',
      },
    },
  ],

  relatorios: [
    {
      popover: {
        title: 'Relatórios 📊',
        description: 'Acompanhe o desempenho do seu negócio com gráficos e números. Filtre por período para ver tendências.',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-relatorios-kpis',
      popover: {
        title: 'Indicadores principais',
        description: 'Faturamento total, número de atendimentos, confirmações pendentes e clientes novas no período selecionado. Compare com períodos anteriores para acompanhar o crescimento.',
      },
    },
    {
      element: '#ob-relatorios-graficos',
      popover: {
        title: 'Gráficos de desempenho',
        description: 'Logo abaixo você encontra a evolução do faturamento, os dias de maior movimento, clientes novas x fiéis, os serviços mais realizados e faltas/cancelamentos do período.',
      },
    },
  ],

  link_agendamento: [
    {
      popover: {
        title: 'Seu link de agendamento 🔗',
        description: 'Este é o link único do seu portal. Suas clientes acessam para ver seus serviços e agendar horários sem precisar te chamar.',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-link-display',
      popover: {
        title: 'Seu link exclusivo',
        description: 'Este é o endereço do seu portal de agendamento. Você pode copiar e colar em qualquer lugar ou compartilhar diretamente.',
      },
    },
    {
      element: '#ob-link-acoes',
      popover: {
        title: 'Compartilhar o link',
        description: 'Copie o link para colocar na bio do Instagram, ou clique em "Compartilhar no WhatsApp" para enviar diretamente para suas clientes.',
      },
    },
    {
      element: '#ob-link-personalizar',
      popover: {
        title: 'Personalizar o endereço',
        description: 'Troque o endereço padrão por algo que represente seu estúdio, como "lashes-by-carol" ou "studio-da-mari". Fica mais fácil de lembrar e compartilhar.',
      },
    },
  ],

  configuracoes: [
    {
      popover: {
        title: 'Configurações ⚙️',
        description: 'Personalize o sistema e o seu portal de acordo com o seu estúdio.',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-config-perfil',
      popover: {
        title: 'Seu perfil',
        description: 'Atualize seu nome, foto de perfil e telefone de contato.',
      },
    },
    {
      element: '#ob-config-negocio',
      popover: {
        title: 'Dados do estúdio',
        description: 'Preencha o nome do estúdio, descrição, Instagram e endereço. Essas informações aparecem no portal das suas clientes.',
      },
    },
    {
      element: '#ob-config-agendamento',
      popover: {
        title: 'Configurações de agendamento',
        description: 'Defina se os agendamentos feitos pelo portal ficam confirmados automaticamente ou aguardam sua aprovação. Personalize também a mensagem que sua cliente recebe ao agendar.',
      },
    },
    {
      element: '#ob-config-visual',
      popover: {
        title: 'Identidade visual',
        description: 'Escolha a paleta de cores do sistema, ative o modo escuro e faça upload da logo do seu estúdio. O portal das clientes vai refletir a sua identidade.',
      },
    },
  ],

  fichas_anamnese: [
    {
      popover: {
        title: 'Fichas de Anamnese 📋',
        description: 'Recurso exclusivo do plano Premium: registre a ficha clínica e as preferências técnicas de lash de cada cliente antes do atendimento.',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-fichas-search',
      popover: {
        title: 'Busca rápida',
        description: 'Encontre qualquer cliente pelo nome para ver ou preencher a ficha dela.',
      },
    },
    {
      element: '#ob-fichas-lista',
      popover: {
        title: 'Lista de clientes',
        description: 'O selo indica se a ficha já foi preenchida ou está pendente. Clique em uma cliente para abrir a ficha completa.',
      },
    },
  ],

  // ── PORTAL DA CLIENTE ──────────────────────────────────────────────────────

  portal_catalogo: [
    {
      popover: {
        title: 'Bem-vinda ao portal! 👋',
        description: 'Aqui você encontra todos os serviços disponíveis e pode agendar seu horário de forma rápida e fácil.',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-portal-estudio-card',
      popover: {
        title: 'Sobre o estúdio',
        description: 'Aqui você confere uma apresentação rápida da profissional, com Instagram e endereço de atendimento, quando disponíveis.',
      },
    },
    {
      element: '#ob-portal-servicos-grid',
      popover: {
        title: 'Catálogo de serviços',
        description: 'Cada card mostra o serviço com foto, preço e duração. Clique em "Agendar" no serviço que te interessar para escolher o dia e horário.',
      },
    },
    {
      element: portalNavElement,
      popover: {
        title: 'Navegação',
        description: 'Pelo menu você acessa o catálogo, agenda um horário, vê seus agendamentos e atualiza seu perfil.',
      },
    },
  ],

  portal_catalogo_anonimo: [
    {
      popover: {
        title: 'Bem-vinda ao portal! 👋',
        description: 'Aqui você encontra todos os serviços disponíveis com preços e duração. E o melhor: para agendar não precisa criar conta nem senha — é só escolher o serviço, o horário e informar seu nome e WhatsApp na confirmação.',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-portal-estudio-card',
      popover: {
        title: 'Sobre o estúdio',
        description: 'Aqui você confere uma apresentação rápida da profissional, com Instagram e endereço de atendimento, quando disponíveis.',
      },
    },
    {
      element: '#ob-portal-servicos-grid',
      popover: {
        title: 'Catálogo de serviços',
        description: 'Cada card mostra o serviço com foto, preço e duração. Clique em "Agendar" no serviço que te interessar para ir direto para a escolha de data e horário.',
      },
    },
    {
      element: portalNavElement,
      popover: {
        title: 'Menu do portal',
        description: 'Por enquanto você vê o Catálogo e pode Agendar livremente. Assim que finalizar seu primeiro agendamento, as abas "Meus Agendamentos" e "Meu Perfil" aparecem aqui automaticamente — sem precisar criar conta.',
      },
    },
  ],

  portal_agendar: [
    {
      popover: {
        title: 'Agendar um horário 📅',
        description: 'São 4 passos rápidos: Serviços, Data, Horário e Confirmação. Você pode voltar e ajustar qualquer passo antes de confirmar.',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-portal-servico-select',
      popover: {
        title: 'Escolha o serviço',
        description: 'Toque na linha do serviço para selecioná-lo — ela fica destacada em rosa. Você pode escolher mais de um serviço no mesmo agendamento.',
      },
    },
    {
      element: '#ob-portal-calendario',
      popover: {
        title: 'Escolha a data',
        description: 'Selecione um dia disponível no calendário. Dias em cinza não têm horários disponíveis. Ao escolher a data, você já avança direto para os horários.',
      },
    },
    {
      element: '#ob-portal-horarios',
      popover: {
        title: 'Escolha o horário',
        description: 'Só aparecem os horários realmente livres nesse dia — os já ocupados são removidos da lista automaticamente. Toque no horário desejado e clique em Continuar.',
      },
    },
    {
      element: '#ob-portal-resumo',
      popover: {
        title: 'Revise e confirme',
        description: 'Confira o resumo com serviços, data, horário e valor total. Se for seu primeiro agendamento aqui, informe seu nome e WhatsApp — não é preciso criar senha. Depois é só confirmar!',
      },
    },
  ],

  portal_agendamentos: [
    {
      popover: {
        title: 'Meus Agendamentos 🗓',
        description: 'Aqui você acompanha todos os seus horários marcados — os próximos e o histórico de atendimentos.',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-portal-proximos',
      popover: {
        title: 'Próximos atendimentos',
        description: 'Seus agendamentos futuros aparecem aqui. O status indica se está pendente de confirmação, confirmado ou cancelado.',
      },
    },
    {
      element: '#ob-portal-historico',
      popover: {
        title: 'Histórico',
        description: 'Todos os seus atendimentos anteriores ficam registrados aqui para você consultar quando quiser.',
      },
    },
  ],

  portal_perfil: [
    {
      popover: {
        title: 'Meu Perfil 👤',
        description: 'Aqui você mantém seus dados atualizados para facilitar o agendamento.',
        side: 'over' as any, align: 'center',
      },
    },
    {
      element: '#ob-portal-foto',
      popover: {
        title: 'Foto de perfil',
        description: 'Adicione uma foto para deixar seu cadastro mais pessoal. É só clicar em "Alterar Foto".',
      },
    },
    {
      element: '#ob-portal-dados-pessoais',
      popover: {
        title: 'Dados pessoais',
        description: 'Mantenha seu nome, sobrenome e WhatsApp atualizados — são usados para confirmar seus agendamentos. O e-mail é opcional.',
      },
    },
  ],
};

// Fallback local para marcar dicas como vistas independente de login — necessário
// no portal, onde visitantes anônimas navegam sem conta (sem `usuarios.onboarding_paginas_vistas`
// pra persistir), então cada troca de tela seria tratada como "primeira vez".
const LOCAL_SEEN_KEY = 'lashhub-onboarding-seen';

function getLocalSeen(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_SEEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function markLocalSeen(key: string) {
  try {
    const current = getLocalSeen();
    if (!current.includes(key)) {
      localStorage.setItem(LOCAL_SEEN_KEY, JSON.stringify([...current, key]));
    }
  } catch {
    // localStorage indisponível (ex: modo privado) — sem persistência local, sem quebrar o fluxo
  }
}

const DRIVER_CONFIG = (onComplete: () => void, doneBtnText = 'Concluir ✓') =>
  ({
    animate: true,
    smoothScroll: true,
    allowClose: true,
    overlayOpacity: 0.6,
    stagePadding: 6,
    stageRadius: 12,
    showProgress: true,
    progressText: '{{current}}/{{total}}',
    popoverClass: 'lashhub-onboarding-popover',
    nextBtnText: 'Próximo →',
    prevBtnText: '← Anterior',
    doneBtnText,
    onDestroyed: onComplete,
  } as Parameters<typeof driver>[0]);

export function useOnboarding(
  pageKey: OnboardingPageKey,
  options?: { studioName?: string | null; isPremium?: boolean; hasPending?: boolean }
) {
  const { isPaginaVista, markPageSeen, loading } = useAuth();

  // Combina a marcação salva na conta (quando logada) com o fallback local —
  // basta uma das duas ter registrado a página como vista.
  const hasSeenPage = () => isPaginaVista(pageKey) || getLocalSeen().includes(pageKey);

  // Ref garante que startTour sempre lê as options mais recentes (studioName,
  // isPremium, hasPending), mesmo quando chamado dentro de um setTimeout com
  // closure desatualizado.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const startTour = () => {
    // "Meu Estúdio" tem layouts bem diferentes por plano — escolhe o roteiro certo.
    let steps = pageKey === 'meu_estudio'
      ? (optionsRef.current?.isPremium ? MEU_ESTUDIO_STEPS_PREMIUM : MEU_ESTUDIO_STEPS_BASICO)
      : STEPS[pageKey];

    if (!steps?.length) return;

    // Na Agenda, o painel "Aguardando confirmação" só existe no DOM quando há
    // pelo menos 1 agendamento pendente — sem isso o passo aponta pro nada.
    if (pageKey === 'agendamentos' && !optionsRef.current?.hasPending) {
      steps = steps.filter(s => s.element !== '#ob-agend-pendentes');
    }

    // Personaliza o primeiro passo com o nome do estúdio quando disponível
    const studioName = optionsRef.current?.studioName;
    if (studioName && steps[0]?.popover) {
      steps = [
        {
          ...steps[0],
          popover: {
            ...steps[0].popover,
            title: `Bem-vinda ao portal da ${studioName}! \u{1F44B}`,
          },
        },
        ...steps.slice(1),
      ];
    }

    const isLastPage = pageKey === 'meu_estudio';
    const doneBtnText = isLastPage ? 'Começar a usar \u{1F389}' : 'Concluir ✓';

    const driverObj = driver({
      ...DRIVER_CONFIG(() => {
        markPageSeen(pageKey);
        markLocalSeen(pageKey);
      }, doneBtnText),
      steps,
    });

    driverObj.drive();
  };

  const autoStart = () => {
    if (loading) return; // aguarda o profile carregar antes de avaliar
    if (hasSeenPage()) return;
    setTimeout(() => startTour(), 500);
  };

  return { startTour, autoStart, loading, isPaginaVista: hasSeenPage };
}
