import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Ajustez le chemin selon votre structure
import { ethers } from 'ethers';

interface WalletVerification {
  communityMember: boolean;
  platformAuthorized: boolean;
  previouslyAccepted: any | null;
  walletAddress: string;
}

interface LegalAcceptanceForm {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  risksAccepted: boolean;
  noGuaranteeUnderstood: boolean;
  lossRiskAccepted: boolean;
  finalConfirmation: boolean;
}

const PlatformAccessPage: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [verification, setVerification] = useState<WalletVerification | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showLegalSection, setShowLegalSection] = useState<boolean>(false);
  const [formData, setFormData] = useState<LegalAcceptanceForm>({
    termsAccepted: false,
    privacyAccepted: false,
    risksAccepted: false,
    noGuaranteeUnderstood: false,
    lossRiskAccepted: false,
    finalConfirmation: false
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Fonction pour obtenir l'IP utilisateur
  const getUserIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Erreur récupération IP:', error);
      return 'unknown';
    }
  };

  // Fonction pour connecter le wallet
  const connectWallet = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (!window.ethereum) {
        throw new Error('MetaMask non détecté. Veuillez installer MetaMask.');
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('Aucun compte sélectionné.');
      }

      const address = accounts[0].toLowerCase();
      setWalletAddress(address);
      setIsConnected(true);

      // Vérification des autorisations
      await verifyWalletAccess(address);

    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Vérification des autorisations wallet
  const verifyWalletAccess = async (address: string) => {
    try {
      setIsLoading(true);

      // 1. Vérifier membre communauté
      const { data: communityData } = await supabase
        .from('community_members')
        .select('status')
        .eq('wallet_address', address)
        .eq('status', 'active')
        .single();

      const isCommunityMember = !!communityData;

      // 2. Vérifier autorisation plateforme
      const { data: authData } = await supabase
        .from('authorized_wallets') // Adaptez selon votre table
        .select('*')
        .eq('wallet_address', address)
        .eq('status', 'active')
        .single();

      const isPlatformAuthorized = !!authData;

      // 3. Vérifier acceptation précédente
      const { data: acceptanceData } = await supabase
        .from('platform_legal_acceptances')
        .select('*')
        .eq('wallet_address', address)
        .order('acceptance_date', { ascending: false })
        .limit(1);

      const previousAcceptance = acceptanceData && acceptanceData.length > 0 ? acceptanceData[0] : null;

      const verificationResult: WalletVerification = {
        communityMember: isCommunityMember,
        platformAuthorized: isPlatformAuthorized,
        previouslyAccepted: previousAcceptance,
        walletAddress: address
      };

      setVerification(verificationResult);

      // Gestion des redirections
      if (previousAcceptance && isRecentAcceptance(previousAcceptance)) {
        setSuccess('Accès autorisé ! Redirection vers la plateforme...');
        setTimeout(() => {
          window.location.href = '/dashboard'; // Adaptez selon votre route
        }, 2000);
        return;
      }

      if (isCommunityMember && isPlatformAuthorized) {
        setShowLegalSection(true);
      } else {
        setError(getAccessDeniedMessage(verificationResult));
      }

    } catch (error: any) {
      setError('Erreur lors de la vérification: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Vérifier si l'acceptation est récente (90 jours)
  const isRecentAcceptance = (acceptance: any): boolean => {
    const acceptanceDate = new Date(acceptance.acceptance_date);
    const now = new Date();
    const diffDays = (now.getTime() - acceptanceDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays < 90;
  };

  // Message d'accès refusé
  const getAccessDeniedMessage = (verification: WalletVerification): string => {
    if (!verification.communityMember) {
      return 'Vous devez d\'abord être membre de la communauté CryptocaVault.';
    }
    if (!verification.platformAuthorized) {
      return 'Votre wallet n\'est pas autorisé pour accéder à la plateforme. Contactez l\'administrateur.';
    }
    return 'Accès refusé pour une raison inconnue.';
  };

  // Gestion du changement des checkboxes
  const handleCheckboxChange = (field: keyof LegalAcceptanceForm) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Vérifier si le formulaire est valide
  const isFormValid = (): boolean => {
    return Object.values(formData).every(value => value === true);
  };

  // Générer un hash d'acceptation
  const generateAcceptanceHash = async (address: string, data: LegalAcceptanceForm): Promise<string> => {
    const dataToHash = JSON.stringify({
      wallet: address,
      timestamp: Date.now(),
      acceptances: data
    });
    
    const msgBuffer = new TextEncoder().encode(dataToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Enregistrer l'acceptation
  const recordLegalAcceptance = async () => {
    try {
      setIsLoading(true);
      setError('');

      const userIP = await getUserIP();
      const acceptanceHash = await generateAcceptanceHash(walletAddress, formData);

      const acceptanceRecord = {
        wallet_address: walletAddress,
        terms_accepted: formData.termsAccepted,
        privacy_accepted: formData.privacyAccepted,
        risks_accepted: formData.risksAccepted,
        no_guarantee_understood: formData.noGuaranteeUnderstood,
        loss_risk_accepted: formData.lossRiskAccepted,
        final_confirmation: formData.finalConfirmation,
        acceptance_date: new Date().toISOString(),
        acceptance_ip: userIP,
        user_agent: navigator.userAgent,
        terms_version: "1.0",
        privacy_version: "1.0",
        risks_version: "1.0",
        acceptance_hash: acceptanceHash
      };

      const { error: insertError } = await supabase
        .from('platform_legal_acceptances')
        .insert([acceptanceRecord]);

      if (insertError) {
        throw new Error('Erreur enregistrement: ' + insertError.message);
      }

      // Enregistrement audit log
      await supabase.from('audit_logs').insert([{
        action: 'legal_acceptance',
        wallet_address: walletAddress,
        timestamp: new Date().toISOString(),
        details: JSON.stringify({ acceptanceHash }),
        ip_address: userIP
      }]);

      setSuccess('Conditions acceptées avec succès ! Redirection vers la plateforme...');
      
      setTimeout(() => {
        window.location.href = '/dashboard'; // Adaptez selon votre route
      }, 2000);

    } catch (error: any) {
      setError('Erreur lors de l\'enregistrement: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Gestion de la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      setError('Veuillez accepter toutes les conditions obligatoires.');
      return;
    }
    await recordLegalAcceptance();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            🔐 Accès Sécurisé à CryptocaVault
          </h1>
          <p className="text-gray-600">
            Veuillez connecter votre wallet et accepter les conditions légales pour accéder à la plateforme.
          </p>
        </div>

        {/* Messages d'erreur et succès */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            ✅ {success}
          </div>
        )}

        {/* Section 1: Vérification Wallet */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">🔐 Vérification Wallet</h2>
          
          {!isConnected ? (
            <button
              onClick={connectWallet}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
            >
              {isLoading ? 'Connexion...' : 'Connecter votre Wallet'}
            </button>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-green-600 font-semibold mb-2">
                ✅ Wallet connecté: {walletAddress}
              </p>
              
              {verification && (
                <div className="space-y-2">
                  <p className={verification.communityMember ? 'text-green-600' : 'text-red-600'}>
                    {verification.communityMember ? '✅' : '❌'} Membre de la communauté
                  </p>
                  <p className={verification.platformAuthorized ? 'text-green-600' : 'text-red-600'}>
                    {verification.platformAuthorized ? '✅' : '❌'} Wallet autorisé pour la plateforme
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Documents Légaux */}
        {showLegalSection && (
          <>
            <div className="mb-8">
              <h3 className="text-2xl font-semibold mb-4">📋 Documents Légaux Obligatoires</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <a 
                  href="/conditions-utilisation" 
                  target="_blank" 
                  className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg border text-center transition-colors"
                >
                  📄 Conditions d'Utilisation
                </a>
                <a 
                  href="/politique-confidentialite" 
                  target="_blank"
                  className="bg-green-50 hover:bg-green-100 p-4 rounded-lg border text-center transition-colors"
                >
                  🔒 Politique de Confidentialité
                </a>
                <a 
                  href="/divulgation-risques" 
                  target="_blank"
                  className="bg-red-50 hover:bg-red-100 p-4 rounded-lg border text-center transition-colors"
                >
                  ⚠️ Divulgation des Risques
                </a>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-bold text-red-800 mb-2">⚠️ AVERTISSEMENT IMPORTANT</h4>
                <p className="text-red-700">
                  La plateforme CryptocaVault ne garantit aucun rendement fixe ni APR. 
                  Toutes les récompenses sont basées exclusivement sur la performance 
                  des stratégies utilisées et peuvent être nulles.
                </p>
              </div>
            </div>

            {/* Section 3: Acceptation Obligatoire */}
            <div className="mb-8">
              <h3 className="text-2xl font-semibold mb-4">✅ Acceptation Obligatoire</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Checkboxes d'acceptation */}
                <div className="space-y-4">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.termsAccepted}
                      onChange={() => handleCheckboxChange('termsAccepted')}
                      className="mt-1 h-4 w-4 text-blue-600"
                      required
                    />
                    <span className="text-sm">
                      J'ai lu et j'accepte les{' '}
                      <a href="/conditions-utilisation" target="_blank" className="text-blue-600 underline">
                        Conditions d'Utilisation
                      </a>
                    </span>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.privacyAccepted}
                      onChange={() => handleCheckboxChange('privacyAccepted')}
                      className="mt-1 h-4 w-4 text-blue-600"
                      required
                    />
                    <span className="text-sm">
                      J'ai lu et j'accepte la{' '}
                      <a href="/politique-confidentialite" target="_blank" className="text-blue-600 underline">
                        Politique de Confidentialité
                      </a>
                    </span>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.risksAccepted}
                      onChange={() => handleCheckboxChange('risksAccepted')}
                      className="mt-1 h-4 w-4 text-blue-600"
                      required
                    />
                    <span className="text-sm">
                      J'ai lu et je comprends la{' '}
                      <a href="/divulgation-risques" target="_blank" className="text-blue-600 underline">
                        Divulgation des Risques
                      </a>
                    </span>
                  </label>

                  {/* Confirmations de risque */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.noGuaranteeUnderstood}
                        onChange={() => handleCheckboxChange('noGuaranteeUnderstood')}
                        className="mt-1 h-4 w-4 text-red-600"
                        required
                      />
                      <span className="text-sm font-semibold">
                        Je comprends et j'accepte qu'AUCUN RENDEMENT FIXE ni APR 
                        n'est garanti et que toutes les récompenses dépendent exclusivement 
                        de la performance des stratégies
                      </span>
                    </label>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.lossRiskAccepted}
                        onChange={() => handleCheckboxChange('lossRiskAccepted')}
                        className="mt-1 h-4 w-4 text-red-600"
                        required
                      />
                      <span className="text-sm font-semibold">
                        J'accepte le risque de perte totale de mes fonds et 
                        confirme que je n'investis que ce que je peux me permettre de perdre
                      </span>
                    </label>
                  </div>

                  {/* Confirmation finale */}
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.finalConfirmation}
                      onChange={() => handleCheckboxChange('finalConfirmation')}
                      className="mt-1 h-4 w-4 text-blue-600"
                      required
                    />
                    <span className="text-sm">
                      Je confirme être majeur(e), avoir la capacité juridique de contracter 
                      et accepter l'intégralité des conditions ci-dessus de ma propre volonté
                    </span>
                  </label>
                </div>

                {/* Bouton de soumission */}
                <button
                  type="submit"
                  disabled={!isFormValid() || isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? 'Traitement...' : '🚀 Accéder à la Plateforme CryptocaVault'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PlatformAccessPage;