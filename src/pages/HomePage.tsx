import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Gem, Star, ArrowRight, Lock } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Section Héro */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="text-blue-400" size={24} />
                <span className="text-blue-400 font-medium">Communauté Privée Exclusive</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                  Accès Premium
                </span>
                <br />
                via Collection NFT
              </h1>
              
              <p className="text-slate-300 text-lg max-w-lg">
                Découvrez notre collection NFT exclusive qui vous donne accès à des opportunités de récompense crypto réservées à notre communauté privée.
              </p>
              
              <div className="bg-slate-800/50 border border-blue-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="text-blue-400" size={20} />
                  <span className="text-blue-400 font-medium">Accès Communauté Requis</span>
                </div>
                <p className="text-slate-300 text-sm">
                  Cette plateforme est exclusivement réservée aux membres de notre communauté pré-approuvés.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  to="/nft-collection"
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Découvrir les NFT
                  <Gem size={18} className="ml-2" />
                </Link>
                <Link
                  to="/about"
                  className="bg-slate-700 hover:bg-slate-600 text-white py-3 px-6 rounded-lg font-medium transition-colors text-center"
                >
                  En Savoir Plus
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600/20 to-indigo-700/20 p-8 rounded-2xl border border-slate-700">
                <div className="absolute -top-5 -right-5 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl"></div>
                
                <h3 className="text-white font-bold text-xl mb-6">Collection NFT Exclusive</h3>
                
                {/* Cartes NFT */}
                <div className="space-y-4 relative z-10">
                  <div className="bg-gradient-to-r from-amber-600/20 to-amber-500/20 backdrop-blur-sm p-4 rounded-lg border border-amber-500/30 hover:border-amber-400 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium flex items-center">
                        🥉 NFT Bronze
                      </span>
                      <span className="bg-amber-600 rounded-full px-3 py-1 text-xs font-semibold text-white">300 USDC</span>
                    </div>
                    <p className="text-slate-300 text-sm">Accès aux stratégies de base avec bonus 1.2X</p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-slate-400/20 to-slate-300/20 backdrop-blur-sm p-4 rounded-lg border border-slate-400/30 hover:border-slate-300 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium flex items-center">
                        🥈 NFT Argent
                      </span>
                      <span className="bg-slate-500 rounded-full px-3 py-1 text-xs font-semibold text-white">750 USDC</span>
                    </div>
                    <p className="text-slate-300 text-sm">Accès étendu avec bonus 1.5X sur les récompenses</p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-400/20 backdrop-blur-sm p-4 rounded-lg border border-yellow-500/30 hover:border-yellow-400 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium flex items-center">
                        🥇 NFT Or
                      </span>
                      <span className="bg-yellow-600 rounded-full px-3 py-1 text-xs font-semibold text-white">1,800 USDC</span>
                    </div>
                    <p className="text-slate-300 text-sm">Accès premium avec bonus 2.0X et stratégies avancées</p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-600/20 to-pink-500/20 backdrop-blur-sm p-4 rounded-lg border border-purple-500/30 hover:border-purple-400 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium flex items-center">
                        💎 NFT Privilège
                      </span>
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full px-3 py-1 text-xs font-semibold text-white">4,500 USDC</span>
                    </div>
                    <p className="text-slate-300 text-sm">Accès VIP exclusif avec bonus 2.5X et avantages premium</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Section Système d'Accès */}
      <section className="py-16 px-4 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Système d'Accès à Double Niveau</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Notre plateforme utilise un système de sécurité à deux niveaux pour garantir un accès exclusif à notre communauté.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
                <h3 className="text-white font-semibold text-xl">Approbation Communauté</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Users className="text-blue-400" size={16} />
                  <span className="text-slate-300 text-sm">Membre de la communauté privée</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="text-blue-400" size={16} />
                  <span className="text-slate-300 text-sm">Wallet pré-approuvé par l'admin</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Lock className="text-blue-400" size={16} />
                  <span className="text-slate-300 text-sm">Accès aux pages de présentation</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm mt-4">
                Contactez-nous via notre canal de communication communautaire pour demander l'accès.
              </p>
            </div>
            
            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
                <h3 className="text-white font-semibold text-xl">Acquisition NFT</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Gem className="text-purple-400" size={16} />
                  <span className="text-slate-300 text-sm">Achat d'un NFT d'accès</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="text-purple-400" size={16} />
                  <span className="text-slate-300 text-sm">Niveau d'accès selon le tier</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ArrowRight className="text-purple-400" size={16} />
                  <span className="text-slate-300 text-sm">Accès complet à la plateforme</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm mt-4">
                Choisissez votre NFT selon le niveau d'accès et les bonus souhaités.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Section Avantages NFT */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Pourquoi Choisir Notre Collection NFT</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Chaque NFT offre des avantages uniques et un accès différencié aux services de récompense.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500 transition-colors">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <Star size={24} className="text-blue-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Bonus Multiplicateurs</h3>
              <p className="text-slate-400 text-sm">
                Chaque NFT offre des multiplicateurs de bonus sur les récompenses, de 1.2X à 2.5X selon le niveau.
              </p>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500 transition-colors">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <Lock size={24} className="text-blue-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Accès Différencié</h3>
              <p className="text-slate-400 text-sm">
                Les NFT de niveau supérieur débloquent l'accès à des stratégies de récompense plus avancées.
              </p>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500 transition-colors">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <Users size={24} className="text-blue-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Communauté Exclusive</h3>
              <p className="text-slate-400 text-sm">
                Rejoignez une communauté privée de détenteurs NFT avec des avantages et insights exclusifs.
              </p>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500 transition-colors">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <Shield size={24} className="text-blue-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Sécurité Renforcée</h3>
              <p className="text-slate-400 text-sm">
                Double authentification : communauté approuvée + possession NFT pour un accès ultra-sécurisé.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Section Comment Commencer */}
      <section className="py-16 px-4 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Comment Commencer</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Suivez ces étapes simples pour rejoindre notre communauté exclusive.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 relative">
              <div className="absolute -top-4 left-4 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <h3 className="text-white font-semibold text-lg mb-4 mt-2">Demandez l'Accès</h3>
              <p className="text-slate-400">
                Contactez-nous via notre canal de communication communautaire pour demander l'ajout de votre wallet à la whitelist.
              </p>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 relative">
              <div className="absolute -top-4 left-4 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <h3 className="text-white font-semibold text-lg mb-4 mt-2">Connectez-vous & Explorez</h3>
              <p className="text-slate-400">
                Une fois approuvé, connectez votre wallet pour découvrir notre collection NFT et les avantages de chaque niveau.
              </p>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 relative">
              <div className="absolute -top-4 left-4 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <h3 className="text-white font-semibold text-lg mb-4 mt-2">Acquérez & Investissez</h3>
              <p className="text-slate-400">
                Choisissez votre NFT selon vos objectifs et commencez à accéder aux stratégies de récompenses exclusives.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link
              to="/nft-collection"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 px-8 rounded-lg font-medium inline-flex items-center transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Découvrir la Collection NFT
              <Gem size={18} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Section Avertissements */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800/50 border border-yellow-500/30 rounded-lg p-6">
            <h3 className="text-yellow-400 font-semibold text-lg mb-4 flex items-center">
              <Shield className="mr-2" size={20} />
              Informations Importantes
            </h3>
            <div className="space-y-3 text-slate-300 text-sm">
              <p>
                • <strong>Communauté Privée :</strong> L'accès à cette plateforme est exclusivement réservé aux membres pré-approuvés de notre communauté.
              </p>
              <p>
                • <strong>NFT Requis :</strong> Un NFT d'accès est obligatoire pour utiliser les fonctionnalités de la plateforme.
              </p>
              <p>
                • <strong>Les stratégies utilisées sont Risquées :</strong> Tous implication dans les services de récompenses comportent des risques de perte. Les performances passées ne garantissent pas les résultats futurs.
              </p>
              <p>
                • <strong>Pas de Garanties :</strong> Aucune des récompenses n'est garanti. Les récompenses dépendent de la performance réelle des stratégies utilisées et du nombre d'utilisateur de la communauté.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;