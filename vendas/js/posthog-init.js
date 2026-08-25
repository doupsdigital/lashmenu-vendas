/**
 * LASHMENU — CENTRAL POSTHOG ANALYTICS HELPER
 * 
 * Este arquivo inicializa o PostHog com segurança contra ad-blockers
 * e expõe a API window.LashAnalytics para disparar eventos customizados.
 * 
 * INSTRUÇÕES DE CONFIGURAÇÃO:
 * Defina window.POSTHOG_API_KEY e window.POSTHOG_HOST no HTML ou altere os padrões abaixo.
 */

(function() {
  const POSTHOG_API_KEY = window.POSTHOG_API_KEY || 'phc_quN9tH5AsE9pdf9WqMTYa9rxvrytiUC7ofTBsy9YSgX9';
  const POSTHOG_HOST = window.POSTHOG_HOST || 'https://us.i.posthog.com';

  // Snippet oficial assíncrono e resiliente do PostHog
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}
  (p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",
  (r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group identifyGroup updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getActiveMatchingSurveys getNextSurveyStep onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);
  e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  // Inicializar se a chave foi configurada
  if (POSTHOG_API_KEY && POSTHOG_API_KEY !== 'YOUR_POSTHOG_API_KEY') {
    posthog.init(POSTHOG_API_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only',
      autocapture: true,
      capture_pageview: true,
      capture_pageleave: true,
      enable_recording_console_log: false
    });

    // Registra a propriedade 'product: lashmenu' em TODOS os eventos e sessões automaticamente
    if (typeof posthog.register === 'function') {
      posthog.register({
        product: 'lashmenu',
        app: 'lashmenu'
      });
    }
  } else {
    console.warn('[LashAnalytics] PostHog API Key pendente. Para ativar o envio ao PostHog, defina window.POSTHOG_API_KEY ou edite vendas/js/posthog-init.js.');
  }

  // Wrapper global LashAnalytics para chamadas seguras
  window.LashAnalytics = {
    /**
     * Rastreia um evento customizado
     * @param {string} eventName Nome do evento (ex: 'InitiateCheckout', 'Form Step Completed')
     * @param {object} properties Propriedades adicionais do evento
     */
    track: function(eventName, properties) {
      try {
        const payload = Object.assign({
          product: 'lashmenu',
          path: window.location.pathname,
          referrer: document.referrer,
          timestamp: new Date().toISOString()
        }, properties || {});

        if (window.posthog && typeof window.posthog.capture === 'function') {
          window.posthog.capture(eventName, payload);
        }
        console.log('[LashAnalytics Tracked]:', eventName, payload);
      } catch (err) {
        console.error('[LashAnalytics Error]:', err);
      }
    },

    /**
     * Identifica o usuário no PostHog após conversão/onboarding
     * @param {string} distinctId ID único (ex: email ou telefone)
     * @param {object} userTraits Propriedades do usuário (ex: { name, studio_name, plan })
     */
    identify: function(distinctId, userTraits) {
      try {
        if (window.posthog && typeof window.posthog.identify === 'function') {
          window.posthog.identify(distinctId, userTraits || {});
        }
        console.log('[LashAnalytics Identified]:', distinctId, userTraits);
      } catch (err) {
        console.error('[LashAnalytics Identify Error]:', err);
      }
    },

    /**
     * Adiciona rastreamento automático de Scroll Depth na página
     */
    initScrollDepthTracking: function(pageVariant) {
      try {
        const thresholds = [25, 50, 75, 90];
        const reached = {};

        function checkScroll() {
          const docHeight = Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight,
            document.body.clientHeight, document.documentElement.clientHeight
          ) - window.innerHeight;

          if (docHeight <= 0) return;

          const scrollPercent = Math.round((window.scrollY / docHeight) * 100);

          thresholds.forEach(function(percentage) {
            if (scrollPercent >= percentage && !reached[percentage]) {
              reached[percentage] = true;
              window.LashAnalytics.track('scroll_depth', {
                depth_percentage: percentage,
                lp_variant: pageVariant || 'unknown'
              });
            }
          });
        }

        window.addEventListener('scroll', checkScroll, { passive: true });
      } catch (err) {
        console.error('[LashAnalytics Scroll Error]:', err);
      }
    }
  };

})();
