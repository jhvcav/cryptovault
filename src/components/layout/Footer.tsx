import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-white">CryptoVault</h3>
            <p className="text-slate-400 text-sm">
              Une plateforme de premier plan sur des stratégies en cryptomonnaies avec des récompenses compétitifs.
            </p>
            <div className="flex mt-4 space-x-4">
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <Github size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <Mail size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Produits</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/nft-page" className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
                  NFT
                </Link>
              </li>
              {/*<li>
                <Link to="/affiliate" className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
                  Plan Affiliation
                </Link>
              </li>*/}
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Ressources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="#" className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
                  Documentation
                </Link>
              </li>
              <li>
                <Link 
                  to="/roadmap" 
                  className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
                  Roadmap
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="#" className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
                  Sécurité
                </Link>
              </li>
              <a 
                href="/TableauComparatifPlans.html" 
                target="_blank"
                className="text-slate-400 hover:text-blue-400 transition-colors text-sm mt-4 block"
              >
                Tableau comparatif des plans
              </a>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Utilitaires</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/yield-calculator" className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
                  Calculateur de récompense NFT et plans
                </Link>
              </li>
              <li>
                <Link to="/compound-interest-Simulator" className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
                  Calculateur de récompense NFT/Plans Composés
                </Link>
              </li>
              <li>
                <Link to="/strategy-recommender" className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
                  Recommandateur de stratégie
                </Link>
              </li>
              <li>
                <Link to="/calculator-multi-critere" className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
                  Calculateur des plans décompenses
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Légal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms-and-conditions" className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
                  Conditions d'Utilisation
                </Link>
              </li>
              <li>
                <Link to="/politique-et-confidentialite" className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
                  Politique de Confidentialité
                </Link>
              </li>
              <li>
                <Link to="/divulgation-des-risques" className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
                  Divulgation des Risques
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-center text-slate-500 text-sm">
            © {new Date().getFullYear()} CryptocaVault. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;