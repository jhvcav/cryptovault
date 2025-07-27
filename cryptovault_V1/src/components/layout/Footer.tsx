import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-white">CryptoVault</h3>
            <p className="text-slate-400 text-sm">
              Une plateforme de premier plan pour les investissements en staking et farming de cryptomonnaies avec des APR compétitifs.
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
                <Link to="/invest" className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
                  Plans de Staking
                </Link>
              </li>
              <li>
                <Link to="/invest" className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
                  Farming LP
                </Link>
              </li>
              <li>
                <Link to="/invest" className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
                  Calculateur d'Investissement
                </Link>
              </li>
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
                <Link to="#" className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="#" className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
                  Sécurité
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Légal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="#" className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
                  Conditions d'Utilisation
                </Link>
              </li>
              <li>
                <Link to="#" className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
                  Politique de Confidentialité
                </Link>
              </li>
              <li>
                <Link to="#" className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
                  Divulgation des Risques
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-center text-slate-500 text-sm">
            © {new Date().getFullYear()} CryptoVault. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;