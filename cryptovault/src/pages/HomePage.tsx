import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Clock, ShieldCheck, PieChart, ArrowRight } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Section Héro */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                  Maximisez Vos Cryptos
                </span>
                <br />
                Avec des Investissements Intelligents
              </h1>
              <p className="text-slate-300 text-lg max-w-lg">
                CryptoVault propose des plans d'investissement à haut rendement via des protocoles de staking et de farming LP, conçus pour faire fructifier vos actifs en toute sécurité sur le réseau BEP20.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  to="/invest"
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Commencer à Investir
                  <ArrowRight size={18} className="ml-2" />
                </Link>
                <Link
                  to="/dashboard"
                  className="bg-slate-700 hover:bg-slate-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  Voir le Tableau de Bord
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600/20 to-indigo-700/20 p-8 rounded-2xl border border-slate-700">
                <div className="absolute -top-5 -right-5 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl"></div>
                
                <h3 className="text-white font-bold text-xl mb-6">Plans d'Investissement Actuels</h3>
                
                {/* Cartes des plans */}
                <div className="space-y-4 relative z-10">
                  <div className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-lg border border-slate-700 hover:border-blue-500 transition-colors">
                    <div className="flex justify-between mb-2">
                      <span className="text-white font-medium">Plan Débutant</span>
                      <span className="bg-blue-600 rounded-full px-2 py-0.5 text-xs font-semibold text-white">10% APR</span>
                    </div>
                    <p className="text-slate-400 text-sm">Période de blocage de 30 jours avec récompenses quotidiennes</p>
                  </div>
                  
                  <div className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-lg border border-slate-700 hover:border-blue-500 transition-colors">
                    <div className="flex justify-between mb-2">
                      <span className="text-white font-medium">Plan Croissance</span>
                      <span className="bg-blue-600 rounded-full px-2 py-0.5 text-xs font-semibold text-white">15% APR</span>
                    </div>
                    <p className="text-slate-400 text-sm">Période de blocage de 90 jours avec récompenses quotidiennes</p>
                  </div>
                  
                  <div className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-lg border border-slate-700 hover:border-blue-500 transition-colors">
                    <div className="flex justify-between mb-2">
                      <span className="text-white font-medium">Plan Premium</span>
                      <span className="bg-blue-600 rounded-full px-2 py-0.5 text-xs font-semibold text-white">20% APR</span>
                    </div>
                    <p className="text-slate-400 text-sm">Période de blocage de 180 jours avec récompenses quotidiennes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Section Caractéristiques */}
      <section className="py-16 px-4 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Pourquoi Choisir CryptoVault</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Notre plateforme offre des opportunités d'investissement sécurisées, efficaces et rentables sur le marché des cryptomonnaies.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500 transition-colors">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <DollarSign size={24} className="text-blue-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">APR Compétitif</h3>
              <p className="text-slate-400 text-sm">
                Gagnez jusqu'à 20% d'APR sur vos actifs crypto avec nos plans d'investissement gérés par des experts.
              </p>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500 transition-colors">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <Clock size={24} className="text-blue-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Récompenses Quotidiennes</h3>
              <p className="text-slate-400 text-sm">
                Retirez vos récompenses accumulées quotidiennement lorsqu'elles dépassent 1 USDT/USDC.
              </p>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500 transition-colors">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheck size={24} className="text-blue-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Plateforme Sécurisée</h3>
              <p className="text-slate-400 text-sm">
                Vos actifs sont gérés en toute sécurité avec des protocoles de sécurité aux normes de l'industrie.
              </p>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500 transition-colors">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <PieChart size={24} className="text-blue-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Stratégies Diversifiées</h3>
              <p className="text-slate-400 text-sm">
                Accès à de multiples stratégies d'investissement incluant le staking et le farming LP.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Section Comment ça marche */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Comment Ça Marche</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Investir avec CryptoVault est simple, transparent et rentable.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 relative">
              <div className="absolute -top-4 left-4 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <h3 className="text-white font-semibold text-lg mb-4 mt-2">Connectez Votre Portefeuille</h3>
              <p className="text-slate-400">
                Liez votre portefeuille compatible BEP20 à notre plateforme pour déposer des USDT ou USDC.
              </p>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 relative">
              <div className="absolute -top-4 left-4 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <h3 className="text-white font-semibold text-lg mb-4 mt-2">Choisissez un Plan d'Investissement</h3>
              <p className="text-slate-400">
                Sélectionnez parmi nos différents plans d'investissement selon votre durée et APR préférés.
              </p>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 relative">
              <div className="absolute -top-4 left-4 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <h3 className="text-white font-semibold text-lg mb-4 mt-2">Gagnez & Retirez</h3>
              <p className="text-slate-400">
                Commencez à gagner des récompenses quotidiennes et retirez-les à tout moment après qu'elles dépassent 1 USDT/USDC.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link
              to="/invest"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 px-8 rounded-lg font-medium inline-flex items-center transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Commencer à Investir Maintenant
              <ArrowRight size={18} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Section FAQ */}
      <section className="py-16 px-4 bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Questions Fréquentes</h2>
            <p className="text-slate-400">
              Trouvez les réponses aux questions courantes sur l'investissement avec CryptoVault.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-medium text-white mb-2">Comment les rendements sont-ils générés ?</h3>
              <p className="text-slate-400">
                Les rendements sont générés par une combinaison de récompenses de staking et de fourniture de liquidité (LP) sur divers protocoles DeFi au sein de l'écosystème BEP20.
              </p>
            </div>
            
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-medium text-white mb-2">Mon investissement est-il sûr ?</h3>
              <p className="text-slate-400">
                Nous mettons en œuvre des mesures de sécurité robustes et diversifions les investissements à travers des protocoles DeFi éprouvés pour minimiser les risques. Cependant, tous les investissements comportent un certain niveau de risque.
              </p>
            </div>
            
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-medium text-white mb-2">Puis-je retirer mon capital avant la fin de la période de blocage ?</h3>
              <p className="text-slate-400">
                Non, votre capital est bloqué pendant la durée de votre plan choisi. Cependant, vous pouvez retirer les récompenses accumulées quotidiennement tant qu'elles dépassent 1 USDT/USDC.
              </p>
            </div>
            
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-medium text-white mb-2">Quels frais CryptoVault facture-t-il ?</h3>
              <p className="text-slate-400">
                CryptoVault prélève des frais de 2% sur tous les dépôts pour couvrir les coûts opérationnels. Il n'y a pas de frais de retrait pour vos récompenses ou votre capital.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;