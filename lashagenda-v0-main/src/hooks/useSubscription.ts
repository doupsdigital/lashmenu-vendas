import { useAuth } from '../contexts/AuthContext';

export function useSubscription() {
  const { profile, plano, statusAssinatura, trialEndsAt, loading } = useAuth();

  const isPremium = plano === 'premium';
  const isBasico = plano === 'basico';

  const hasFeature = (feature: 'scheduling' | 'crm' | 'dashboard'): boolean => {
    if (loading || !profile) return false;
    
    switch (feature) {
      case 'scheduling':
      case 'dashboard':
        return true; // Ambos os planos têm acesso
      case 'crm':
        return isPremium; // Relatórios e análises avançadas — apenas plano Premium
      default:
        return false;
    }
  };

  const isSubscriptionActive = (): boolean => {
    if (!profile) return false;
    if (statusAssinatura === 'ativo') return true;
    if (statusAssinatura === 'trial') {
      if (!trialEndsAt) return true;
      return new Date(trialEndsAt) > new Date();
    }
    return false;
  };

  return {
    hasFeature,
    isPremium,
    isBasico,
    isSubscriptionActive,
    plano,
    status: statusAssinatura,
    trialEndsAt,
    loading
  };
}
