// src/config/fidelityConfig.ts
// Configuration centralisée pour le NFT Fidélité

export const FIDELITY_NFT_CONFIG = {
  tier: 5,
  name: 'NFT Fidélité',
  displayName: 'NFT Fidélité',
  icon: '🎁',
  originalPrice: '0', // GRATUIT
  originalPriceUSD: 'GRATUIT',
  multiplier: 120, // 1.2x = 20% bonus
  multiplierPercent: '+20%',
  description: 'Récompense de fidélité exclusive pour les membres sélectionnés',
  supply: 12,
  features: [
    'Accès aux stratégies de base',
    'Bonus 20% sur récompenses',
    'Support communautaire',
    'Période de blocage : 30 jours',
    'Récompense de fidélité exclusive'
  ],
  accessPlans: ['starter'],
  lockPeriods: ['30 jours'],
  bgGradient: 'from-emerald-600 via-teal-600 to-cyan-600',
  borderColor: 'border-emerald-500',
  glowColor: 'shadow-emerald-500/30'
};

export const getFidelityMessages = () => ({
  notEligible: 'Non éligible pour le NFT Fidélité',
  eligible: `Éligible pour réclamer votre ${FIDELITY_NFT_CONFIG.displayName} gratuitement`,
  claimed: `${FIDELITY_NFT_CONFIG.displayName} déjà réclamé`,
  owned: `${FIDELITY_NFT_CONFIG.displayName} déjà possédé`,
  claiming: `Réclamation ${FIDELITY_NFT_CONFIG.displayName} en cours...`,
  success: `${FIDELITY_NFT_CONFIG.displayName} réclamé avec succès`,
  error: `Erreur lors de la réclamation du ${FIDELITY_NFT_CONFIG.displayName}`
});

export default FIDELITY_NFT_CONFIG;