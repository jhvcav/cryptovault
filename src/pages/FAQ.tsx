import { useState } from 'react';

const FAQ = () => {
  // État pour suivre quelle FAQ est ouverte
  const [openFaq, setOpenFaq] = useState(null);

  // Liste des questions et réponses
  const faqItems = [
    {
      id: 1,
      question: "Comment les rendements sont-ils générés ?",
      answer: "Les rendements sont générés par plusieurs stratégies d'investissement, notamment l'allocation d'actifs diversifiée, les dividendes d'actions, les intérêts obligataires et les plus-values sur le capital. Notre équipe d'experts financiers analyse continuellement le marché pour optimiser les rendements tout en maintenant un profil de risque approprié."
    },
    {
      id: 2,
      question: "Mon investissement est-il sûr ?",
      answer: "Nous prenons la sécurité de vos investissements très au sérieux. Nous utilisons des protocoles de sécurité avancés et diversifions les investissements à travers différentes classes d'actifs et secteurs pour minimiser les risques. Cependant, comme pour tout investissement, il existe un certain niveau de risque. Nous recommandons toujours d'investir uniquement ce que vous pouvez vous permettre de perdre et de consulter un conseiller financier avant de prendre des décisions d'investissement importantes."
    },
    {
      id: 3,
      question: "Quels sont les frais associés à l'utilisation de la plateforme ?",
      answer: "Notre structure tarifaire est transparente. Nous prélevons des frais de gestion annuels de 0,5% à 1,5% selon le type de portefeuille. Pour les transactions, des frais de 0,1% à 0,3% peuvent s'appliquer. Nous n'appliquons pas de frais cachés ou de commissions de performance. Tous les frais sont clairement indiqués avant chaque transaction."
    },
    {
      id: 4,
      question: "Puis-je retirer mon capital à tout moment ?",
      answer: "Oui, la plupart de nos plans d'investissement permettent un retrait à tout moment sans pénalité. Cependant, certains produits d'investissement spécifiques peuvent avoir des périodes de blocage ou des frais de retrait anticipé. Ces conditions sont toujours clairement indiquées dans les termes de l'investissement avant que vous ne vous engagiez."
    },
    {
      id: 5,
      question: "Quels types d'investissements proposez-vous ?",
      answer: "Notre plateforme propose une large gamme d'options d'investissement, incluant des actions, des obligations, des ETF, des fonds communs de placement, et des produits structurés. Nous offrons également des opportunités dans des secteurs émergents comme les technologies vertes et l'intelligence artificielle. Chaque option est accompagnée d'informations détaillées sur le risque, le rendement potentiel et l'horizon d'investissement recommandé."
    },
    {
      id: 6,
      question: "Comment commencer à investir sur votre plateforme ?",
      answer: "Pour commencer, créez simplement un compte en fournissant les informations requises pour la vérification KYC. Une fois votre compte vérifié, vous pouvez déposer des fonds via virement bancaire, carte de crédit ou autres méthodes de paiement acceptées. Après le dépôt, vous pouvez explorer nos options d'investissement et commencer à construire votre portefeuille. Notre équipe de support est disponible pour vous guider à chaque étape."
    },
    {
      id: 7,
      question: "Proposez-vous des conseils personnalisés en investissement ?",
      answer: "Oui, nous offrons des conseils personnalisés adaptés à vos objectifs financiers, votre tolérance au risque et votre horizon temporel. Nos conseillers financiers certifiés peuvent vous aider à élaborer une stratégie d'investissement sur mesure. Pour les comptes premium, nous proposons également des services de gestion de portefeuille plus avancés avec des conseils réguliers et des ajustements basés sur les conditions du marché."
    },
    {
      id: 8,
      question: "Comment mes données personnelles sont-elles protégées ?",
      answer: "La protection de vos données est notre priorité. Nous utilisons un chiffrement de niveau bancaire pour toutes les transactions et le stockage des données. Nous ne partageons jamais vos informations avec des tiers sans votre consentement explicite. Notre plateforme est régulièrement auditée par des experts en cybersécurité pour garantir que toutes les mesures de protection sont à jour et efficaces contre les menaces potentielles."
    }
  ];

  // Fonction pour basculer l'état d'ouverture/fermeture
  const toggleFaq = (id) => {
    if (openFaq === id) {
      setOpenFaq(null);
    } else {
      setOpenFaq(id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-4">
          Questions Fréquentes
        </h2>
        <p className="text-slate-400">
          Trouvez les réponses aux questions courantes sur notre plateforme d'investissement.
        </p>
      </div>

      <div className="space-y-6 divide-y divide-white-200">
        {faqItems.map((item) => (
          <div key={item.id} className="pt-6">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleFaq(item.id)}
            >
              <h3 className="text-lg font-medium text-white-900">{item.question}</h3>
              <span className="ml-6 flex-shrink-0">
                {openFaq === item.id ? (
                  <svg className="h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </span>
            </div>
            {openFaq === item.id && (
              <div className="mt-2 pr-12">
                <p className="text-base text-white-600">
                  {item.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;