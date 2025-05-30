// src/components/roadmap/RoadmapVisual.tsx
import { useState } from 'react';

interface Phase {
  id: number;
  period: string;
  title: string;
  color: string;
  icon: string;
  keyPoints: string[];
  milestones: string[];
}

const RoadmapVisual = () => {
  const [activePhase, setActivePhase] = useState<number | null>(null);
  
  const phases: Phase[] = [
    {
      id: 1,
      period: "MOIS 1-5",
      title: "FONDATIONS",
      color: "#4F46E5", // Indigo
      icon: "🏗️",
      keyPoints: [
        "Développement et test de la plateforme",
        "Développement et test de la 1ère stratégie DeFi",
        "Conception Whitepaper",
        "Conception du programme de fidélité",
      ],
      milestones: [
        "Plateforme conçu et opérationnelle",
        "Intégration de 2 stratégies DeFi",
        "Structure de fidélité finalisée",
        "Whitepaper finalisé",
      ]
    },
    {
      id: 2,
      period: "MOIS 5-6",
      title: "LANCEMENT INVESTISSEMENTS",
      color: "#10B981", // Emerald
      icon: "🚀",
      keyPoints: [
        "Déploiement des 1er plans de stratégie à la communauté",
        "Diversification des stratégies DeFi",
        "Développement du plan d'affiliation"
      ],
      milestones: [
        "Programme fidélité 100% opérationnel",
        "Premiers affiliés VIP investisseurs",
        "Premier retour sur investissements",
      ]
    },
    {
      id: 3,
      period: "MOIS 6-7",
      title: "DÉVELOPPEMENT AFFILIATION",
      color: "#F59E0B", // Amber
      icon: "💎",
      keyPoints: [
        "Optimisation du programme d'affiliation",
        "Lancement du programme de fidélité"
      ],
      milestones: [
        "Système d'affiliation conçu",
        "Dashboard d'affiliation déployé",
        "Affiliés préparés pour intégration token"
      ]
    },
    {
      id: 4,
      period: "MOIS 7-9",
      title: "TOKEN & COMMUNAUTÉ",
      color: "#EC4899", // Pink
      icon: "🤝",
      keyPoints: [
        "Conception et développement du token",
        "Intégration du token dans la communauté",
        "Retour de la communauté sur les rendements"
      ],
      milestones: [
        "Validation satisfaction de la communauté",
        "Récompenses en token pour la communauté",
      ]
    },
    {
      id: 5,
      period: "MOIS 9-12",
      title: "OPTIMISATION & AUDIT",
      color: "#8B5CF6", // Violet
      icon: "📈",
      keyPoints: [
        "Création et lancement du token du projet",
        "Optimisation de toutes les stratégies",
        "Affiliation multi-niveaux avancée",
        "Audit Smart contrat"
      ],
      milestones: [
        "Audit complet et optimisations",
        "Programme d'affiliation multi-niveaux",
        "Smart contract audité",
      ]
    }
  ];

  return (
    <div className="flex flex-col items-center w-full bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-md">
      <h1 className="text-3xl font-bold text-white mb-6">Roadmap - Projet RMR-M 2025</h1>
      
      {/* Timeline Visual */}
      <div className="relative w-full flex justify-between items-center mb-8">
        <div className="absolute h-2 bg-slate-700 top-1/2 transform -translate-y-1/2 left-0 right-0 z-0"></div>
        
        {phases.map((phase) => (
          <div 
            key={phase.id}
            className="relative z-10 flex flex-col items-center cursor-pointer"
            onClick={() => setActivePhase(activePhase === phase.id ? null : phase.id)}
          >
            <div 
              className={`flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-all duration-300 ${activePhase === phase.id ? 'scale-110' : 'hover:scale-105'}`} 
              style={{ backgroundColor: phase.color }}
            >
              <span className="text-2xl">{phase.icon}</span>
            </div>
            <div className="mt-2 text-center">
              <div className="font-bold text-gray-300">{phase.period}</div>
              <div className="text-sm font-medium" style={{ color: phase.color }}>{phase.title}</div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Detailed Phase View */}
      {activePhase !== null && (
        <div 
          className="w-full mt-4 p-6 rounded-xl shadow-md transition-all duration-500 animate-fadeIn"
          style={{ backgroundColor: phases[activePhase-1].color + '20', borderLeft: `4px solid ${phases[activePhase-1].color}` }}
        >
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-2">{phases[activePhase-1].icon}</span>
            <h2 className="text-xl font-bold text-white">{phases[activePhase-1].period}: {phases[activePhase-1].title}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-gray-300 mb-2">Activités Principales</h3>
              <ul className="space-y-2">
                {phases[activePhase-1].keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full mr-2" style={{ backgroundColor: phases[activePhase-1].color }}></div>
                    <span className="text-gray-200">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-300 mb-2">Jalons Clés</h3>
              <ul className="space-y-2">
                {phases[activePhase-1].milestones.map((milestone, idx) => (
                  <li key={idx} className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 flex items-center justify-center mr-2">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: phases[activePhase-1].color }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-200">{milestone}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {activePhase === null && (
        <div className="w-full mt-4 p-6 rounded-xl bg-slate-800 shadow-md border border-slate-700">
          <div className="text-center text-gray-300">
            <p className="mb-2 font-medium">Cliquez sur une phase pour voir les détails</p>
            <p>Cette feuille de route présente le plan de développement sur 12 mois pour votre plateforme d'investissement.</p>
          </div>
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-400 italic text-center">
        Développez votre écosystème d'investissement DeFi en suivant cette roadmap stratégique
      </div>
    </div>
  );
};

export default RoadmapVisual;