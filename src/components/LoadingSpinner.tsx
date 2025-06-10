// src/components/LoadingSpinner.tsx
import React from 'react';
import { Wallet, Shield, Zap } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  subMessage?: string;
  variant?: 'default' | 'security' | 'wallet' | 'network';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Chargement en cours...", 
  subMessage,
  variant = 'default'
}) => {
  // Configuration des variants
  const variants = {
    default: {
      icon: <Wallet className="w-8 h-8 text-blue-400" />,
      bgGradient: "from-blue-600 to-indigo-700",
      spinnerColor: "border-blue-500",
      accentColor: "text-blue-400"
    },
    security: {
      icon: <Shield className="w-8 h-8 text-green-400" />,
      bgGradient: "from-green-600 to-emerald-700",
      spinnerColor: "border-green-500",
      accentColor: "text-green-400"
    },
    wallet: {
      icon: <Wallet className="w-8 h-8 text-purple-400" />,
      bgGradient: "from-purple-600 to-pink-700",
      spinnerColor: "border-purple-500",
      accentColor: "text-purple-400"
    },
    network: {
      icon: <Zap className="w-8 h-8 text-yellow-400" />,
      bgGradient: "from-yellow-600 to-orange-700",
      spinnerColor: "border-yellow-500",
      accentColor: "text-yellow-400"
    }
  };

  const currentVariant = variants[variant];

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
        {/* Éléments décoratifs animés en arrière-plan */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-purple-500/10 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-32 left-40 w-40 h-40 bg-green-500/10 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-20 right-20 w-28 h-28 bg-yellow-500/10 rounded-full animate-bounce" style={{ animationDelay: '0.7s' }}></div>
        </div>

        {/* Contenu principal */}
        <div className="relative z-10 text-center">
          <div className="flex flex-col items-center space-y-8">
            {/* Logo et spinner combinés */}
            <div className="relative">
              {/* Spinner externe */}
              <div className={`w-24 h-24 border-4 border-gray-600 ${currentVariant.spinnerColor} border-t-transparent rounded-full animate-spin`}></div>
              
              {/* Logo central */}
              <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-r ${currentVariant.bgGradient} rounded-full w-16 h-16 m-4 shadow-2xl`}>
                {currentVariant.icon}
              </div>
            </div>

            {/* Texte de chargement */}
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-white animate-pulse">
                {message}
              </h2>
              
              {subMessage && (
                <p className={`text-lg ${currentVariant.accentColor} fade-in-out`}>
                  {subMessage}
                </p>
              )}
              
              {/* Points de chargement animés */}
              <div className="flex justify-center space-x-2 mt-4">
                <div className={`w-2 h-2 ${currentVariant.accentColor.replace('text-', 'bg-')} rounded-full animate-bounce`}></div>
                <div className={`w-2 h-2 ${currentVariant.accentColor.replace('text-', 'bg-')} rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }}></div>
                <div className={`w-2 h-2 ${currentVariant.accentColor.replace('text-', 'bg-')} rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>

            {/* Barre de progression indéterminée */}
            <div className="w-64 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${currentVariant.bgGradient} rounded-full progress-indeterminate`}></div>
            </div>

            {/* Informations supplémentaires */}
            <div className="text-center space-y-2 max-w-md">
              <p className="text-gray-400 text-sm">
                🛡️ Vérification de la sécurité en cours...
              </p>
              <p className="text-gray-500 text-xs">
                Veuillez patienter pendant que nous sécurisons votre connexion
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Styles CSS inline */}
      <style>{`
        @keyframes fade-in-out {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        @keyframes progress-indeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .fade-in-out {
          animation: fade-in-out 2s ease-in-out infinite;
        }
        
        .progress-indeterminate {
          animation: progress-indeterminate 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default LoadingSpinner;