import React, { useState } from 'react';
import { Wallet as WalletX } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useInvestment } from '../contexts/InvestmentContext';
import PlanCard from '../components/invest/PlanCard';
import { InvestmentModal } from '../components/invest/InvestmentModal';

const InvestPage = () => {
  const { isConnected } = useWallet();
  const { plans, invest } = useInvestment();
  
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const handleSelectPlan = (planId: number) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      setSelectedPlan(plan);
      setModalOpen(true);
    }
  };
  
  const handleInvest = async (planId: number, amount: number, token: 'USDT' | 'USDC') => {
    console.log('handleInvest appelé avec:', { planId, amount, token });
    try {
      const result = await invest(planId, amount, token);
      console.log('Résultat de invest():', result);
      return result;
    } catch (error) {
      console.error('Erreur dans handleInvest:', error);
      return false;
    }
  };
  
  const closeModal = () => {
    setModalOpen(false);
    setSelectedPlan(null);
  };

  
  if (!isConnected) {
    return (
      <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <WalletX size={40} className="text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Portefeuille Non Connecté</h2>
          <p className="text-slate-400 mb-6">
            Veuillez connecter votre portefeuille pour voir les plans d'investissement disponibles et commencer à investir.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200"
          >
            Retour à l'Accueil
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-4">Plans d'Investissement</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Choisissez le plan d'investissement qui correspond le mieux à votre stratégie. Chaque plan offre différents taux APR et périodes de blocage.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map(plan => (
            <PlanCard 
              key={plan.id} 
              plan={plan} 
              onInvest={handleSelectPlan} 
            />
          ))}
        </div>
        
        <div className="mt-16 bg-slate-800 rounded-lg p-8 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-6">Comment Fonctionnent Nos Plans d'Investissement</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Processus d'Investissement</h3>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                  <span>Sélectionnez un plan d'investissement selon votre APR et période de blocage préférés.</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                  <span>Déposez des USDT ou USDC depuis votre portefeuille BEP20. Des frais de plateforme de 2% seront déduits.</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                  <span>Commencez à gagner des récompenses quotidiennes basées sur l'APR de votre plan d'investissement.</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                  <span>Retirez vos récompenses à tout moment après qu'elles dépassent 1 USDT/USDC.</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">5</span>
                  <span>Votre capital sera restitué à la fin de la période de blocage.</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Notes Importantes</h3>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start">
                  <span className="text-blue-400 mr-3">•</span>
                  <span>Tous les investissements sont effectués via le réseau BEP20 en USDT ou USDC.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-3">•</span>
                  <span>Votre capital est bloqué pendant la durée de votre plan choisi.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-3">•</span>
                  <span>Les récompenses quotidiennes sont calculées sur la base du taux annuel (APR) divisé par 365 jours.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-3">•</span>
                  <span>Les frais de plateforme (2%) sont déduits à l'avance de votre dépôt.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-3">•</span>
                  <span>Les rendements sont soumis aux conditions du marché mais votre capital est garanti.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <InvestmentModal 
        plan={selectedPlan}
        isOpen={modalOpen}
        onClose={closeModal}
        onInvest={handleInvest}
      />
    </div>
  );
};

export default InvestPage;