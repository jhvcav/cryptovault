// components/MigrationBanner.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, X, Info } from 'lucide-react';

interface MigrationBannerProps {
  currentVersion: 'V1' | 'V2';
  onDismiss?: () => void;
}

const MigrationBanner: React.FC<MigrationBannerProps> = ({ currentVersion, onDismiss }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || currentVersion === 'V2') return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 border-l-4 border-blue-400 p-4 mb-6 relative">
      <div className="flex items-center">
        <div className="bg-blue-500/20 rounded-full p-2 mr-3">
          <Info size={20} className="text-blue-200" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-white font-medium text-lg mb-1">
            🚀 Nouvelle Version Disponible !
          </h3>
            <p className="text-blue-100 text-sm mb-3">
            Vos plan actuellements en cours resteront accessible ici sur cette version de tableau de bord.
            </p>
            <p className="text-blue-100 text-sm mb-3">
            Les nouveaux dépôt se feront sur une nouvelle interface et nouveau smart contrat.
            </p>
            <p className="text-blue-100 text-sm mb-3">
            Découvrez votre Dashboard V2 avec les récompenses mises à jours.
            </p>
          
          <div className="flex flex-wrap gap-3">
            <Link
              to="/invest"
              className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm"
            >
              Nouveau dépôt
              <ArrowRight size={16} className="ml-2" />
            </Link>
            
            <button
              onClick={handleDismiss}
              className="inline-flex items-center px-4 py-2 bg-blue-500/20 text-blue-100 rounded-lg font-medium hover:bg-blue-500/30 transition-colors text-sm"
            >
              Plus tard
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-blue-200 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="mt-3 text-xs text-blue-200">
        💡 Vos plans actuels resteront accessibles sur cette version jusqu'à la fin de leur période.
      </div>
    </div>
  );
};

export default MigrationBanner;