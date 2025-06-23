import React, { useState, useEffect } from 'react';

interface NFTConfig {
  id: number;
  name: string;
  level: string;
}

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
  background_color?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

const NFTCards: React.FC = () => {
  const [nftMetadata, setNftMetadata] = useState<Record<number, NFTMetadata>>({});
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configuration des NFT (sans images locales)
  const nftConfig: NFTConfig[] = [
    { id: 1, name: 'Bronze NFT', level: 'Accès Bronze' },
    { id: 2, name: 'Silver NFT', level: 'Accès Silver' },
    { id: 3, name: 'Gold NFT', level: 'Accès Gold' },
    { id: 4, name: 'Privilege NFT', level: 'Accès Privilège' },
    { id: 5, name: 'Fidelity NFT', level: 'Accès Fidélité' }
  ];

  // Données JSON complètes de vos 5 NFT
  const hardcodedMetadata: Record<number, NFTMetadata> = {
    1: {
      "name": "Vaelith de Sève #1",
      "description": "Gardien des premières essences, Vaelith de Sève offre un passage vers les stratégies fondamentales de CryptocaVault. Son pouvoir réside dans sa capacité à amplifier les récompenses de 20%.",
      "image": "https://olive-quick-dolphin-266.mypinata.cloud/ipfs/bafybeigxbp6vequoldugofjjnt6x6kitzpluef6iv5l2gxl5mtbm3y7yca/images/bronze_nft.png",
      "attributes": [
        { "trait_type": "Nom Artistique", "value": "Vaelith de Sève" },
        { "trait_type": "Tier Technique", "value": "Bronze" },
        { "trait_type": "Élément", "value": "Sève" },
        { "trait_type": "Multiplier", "value": "1.2x" },
        { "trait_type": "Bonus", "value": "20%" },
        { "trait_type": "Access Plans", "value": "Starter" },
        { "trait_type": "Rarity", "value": "Typique" },
        { "trait_type": "Price", "value": "120 USDC" },
        { "trait_type": "Supply", "value": "1000" },
        { "trait_type": "Pouvoir", "value": "Essence Primitive" }
      ],
      "background_color": "8B4513"
    },
    2: {
      "name": "Sylwen des Brumes #2",
      "description": "Maître des voiles éthérés, Sylwen des Brumes guide les initiés vers des stratégies plus raffinées. Sa magie des brumes multiplie les récompenses par 1.5.",
      "image": "https://olive-quick-dolphin-266.mypinata.cloud/ipfs/bafybeigxbp6vequoldugofjjnt6x6kitzpluef6iv5l2gxl5mtbm3y7yca/images/silver_nft.png",
      "attributes": [
        { "trait_type": "Nom Artistique", "value": "Sylwen des Brumes" },
        { "trait_type": "Tier Technique", "value": "Silver" },
        { "trait_type": "Élément", "value": "Brumes" },
        { "trait_type": "Multiplier", "value": "1.5x" },
        { "trait_type": "Bonus", "value": "50%" },
        { "trait_type": "Access Plans", "value": "Starter + Standard" },
        { "trait_type": "Rarity", "value": "Atypique" },
        { "trait_type": "Price", "value": "250 USDC" },
        { "trait_type": "Supply", "value": "500" },
        { "trait_type": "Pouvoir", "value": "Voile Éthéré" }
      ],
      "background_color": "C0C0C0"
    },
    3: {
      "name": "Nymeriel de Lune #3",
      "description": "Archonte des cycles célestes, Nymeriel de Lune dévoile les secrets des stratégies premium. Sous sa protection lunaire, les récompenses doublent.",
      "image": "https://olive-quick-dolphin-266.mypinata.cloud/ipfs/bafybeigxbp6vequoldugofjjnt6x6kitzpluef6iv5l2gxl5mtbm3y7yca/images/gold_nft.png",
      "attributes": [
        { "trait_type": "Nom Artistique", "value": "Nymeriel de Lune" },
        { "trait_type": "Tier Technique", "value": "Gold" },
        { "trait_type": "Élément", "value": "Lune" },
        { "trait_type": "Multiplier", "value": "2.0x" },
        { "trait_type": "Bonus", "value": "100%" },
        { "trait_type": "Access Plans", "value": "Starter + Standard + Premium" },
        { "trait_type": "Rarity", "value": "Rare" },
        { "trait_type": "Price", "value": "500 USDC" },
        { "trait_type": "Supply", "value": "200" },
        { "trait_type": "Pouvoir", "value": "Cycle Céleste" }
      ],
      "background_color": "FFD700"
    },
    4: {
      "name": "Faeloria la Radieuse #4",
      "description": "Souveraine des lumières transcendantes, Faeloria la Radieuse octroie l'accès aux mystères ultimes de CryptocaVault. Sa radiance divine amplifie les récompenses de 150%.",
      "image": "https://olive-quick-dolphin-266.mypinata.cloud/ipfs/bafybeigxbp6vequoldugofjjnt6x6kitzpluef6iv5l2gxl5mtbm3y7yca/images/privilege_nft.png",
      "attributes": [
        { "trait_type": "Nom Artistique", "value": "Faeloria la Radieuse" },
        { "trait_type": "Tier Technique", "value": "Privilege" },
        { "trait_type": "Élément", "value": "Radiance" },
        { "trait_type": "Multiplier", "value": "2.5x" },
        { "trait_type": "Bonus", "value": "150%" },
        { "trait_type": "Access Plans", "value": "All Plans" },
        { "trait_type": "Rarity", "value": "Epique" },
        { "trait_type": "Price", "value": "1000 USDC" },
        { "trait_type": "Supply", "value": "50" },
        { "trait_type": "Pouvoir", "value": "Transcendance Divine" }
      ],
      "background_color": "8A2BE2"
    },
    5: {
      "name": "Lúmëran de l'Alliance #5",
      "description": "Gardien éternel des serments sacrés, Lúmëran de l'Alliance honore la fidélité des premiers disciples. Ce don divin amplifie les récompenses de 20% en témoignage de loyauté.",
      "image": "https://olive-quick-dolphin-266.mypinata.cloud/ipfs/bafybeigxbp6vequoldugofjjnt6x6kitzpluef6iv5l2gxl5mtbm3y7yca/images/fidelity_nft.png",
      "attributes": [
        { "trait_type": "Nom Artistique", "value": "Lúmëran de l'Alliance" },
        { "trait_type": "Tier Technique", "value": "Fidelity" },
        { "trait_type": "Élément", "value": "Alliance" },
        { "trait_type": "Multiplier", "value": "1.2x" },
        { "trait_type": "Bonus", "value": "20%" },
        { "trait_type": "Access Plans", "value": "Starter" },
        { "trait_type": "Rarity", "value": "Legendaire" },
        { "trait_type": "Price", "value": "FREE" },
        { "trait_type": "Supply", "value": "50" },
        { "trait_type": "Type", "value": "Fidelity Reward" },
        { "trait_type": "Pouvoir", "value": "Serment Éternel" },
        { "trait_type": "Origine", "value": "Don de Fidélité" }
      ],
      "background_color": "50C878"
    }
  };

  // Fonction pour charger les métadonnées (simulée pour l'instant)
  const loadNFTMetadata = async (id: number): Promise<NFTMetadata | null> => {
    try {
      // Simulation d'un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Retourner les données hardcodées (remplacez par un fetch réel si nécessaire)
      return hardcodedMetadata[id] || null;
    } catch (error) {
      console.error(`Erreur lors du chargement des métadonnées pour NFT ${id}:`, error);
      return null;
    }
  };

  // Précharger les métadonnées
  useEffect(() => {
    const preloadMetadata = async () => {
      try {
        setLoading(true);
        const metadataMap: Record<number, NFTMetadata> = {};
        
        for (const nft of nftConfig) {
          const metadata = await loadNFTMetadata(nft.id);
          if (metadata) {
            metadataMap[nft.id] = metadata;
          }
        }

        setNftMetadata(metadataMap);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du préchargement:', error);
        setError('Impossible de charger les métadonnées NFT');
        setLoading(false);
      }
    };

    preloadMetadata();
  }, []);

  // Gérer le clic sur une carte
  const handleCardClick = async (nftId: number) => {
    if (activeDropdown === nftId) {
      setActiveDropdown(null);
      return;
    }

    // Charger les métadonnées si pas encore chargées
    if (!nftMetadata[nftId]) {
      const metadata = await loadNFTMetadata(nftId);
      if (metadata) {
        setNftMetadata(prev => ({ ...prev, [nftId]: metadata }));
      }
    }

    setActiveDropdown(nftId);
  };

  // Fonction pour obtenir l'icône appropriée pour chaque attribut
  const getAttributeIcon = (traitType: string): string => {
    switch (traitType) {
      case 'Nom Artistique': return '✨';
      case 'Tier Technique': return '🏆';
      case 'Élément': return '🌿';
      case 'Multiplier': return '📈';
      case 'Bonus': return '⚡';
      case 'Access Plans': return '🎯';
      case 'Rarity': return '💎';
      case 'Price': return '💰';
      case 'Supply': return '📦';
      case 'Pouvoir': return '🔮';
      case 'Type': return '🏷️';
      case 'Origine': return '🌟';
      default: return '🔸';
    }
  };

  // Rendu du contenu du dropdown
  const renderDropdownContent = (nft: NFTConfig) => {
    const metadata = nftMetadata[nft.id];

    if (!metadata) {
      return (
        <div className="text-red-400 p-4 bg-red-900/20 rounded-lg">
          <h3 className="text-lg font-bold mb-2">⚠️ Aucune donnée</h3>
          <p>Métadonnées non disponibles pour ce NFT.</p>
          <p className="text-sm mt-1">
            Ajoutez les données JSON pour le NFT #{nft.id} dans le composant.
          </p>
        </div>
      );
    }

    return (
      <div className="text-white text-left leading-relaxed">
        {/* Nom artistique avec style amélioré */}
        <div className="mb-6 text-center">
          <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 mb-2">
            ✨ {metadata.name || nft.name}
          </h3>
          <div className="text-gray-300 text-lg font-medium">
            {metadata.attributes?.find(attr => attr.trait_type === 'Élément')?.value} • {metadata.attributes?.find(attr => attr.trait_type === 'Pouvoir')?.value}
          </div>
        </div>
        
        {/* Description améliorée et complète */}
        <div className="mb-6 p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-lg border-l-4 border-yellow-400">
          <p className="text-gray-200 leading-relaxed text-base font-medium">
            {metadata.description || 'Aucune description disponible'}
          </p>
        </div>

        {/* Informations clés extraites des attributs */}
        {metadata.attributes && metadata.attributes.length > 0 && (
          <>
            {/* Prix et informations principales */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {metadata.attributes
                .filter(attr => ['Price', 'Tier Technique', 'Bonus', 'Rarity'].includes(attr.trait_type))
                .map((attr, index) => (
                  <div key={index} className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-3 rounded-lg">
                    <div className="text-xs text-gray-400 uppercase tracking-wide">
                      {attr.trait_type === 'Price' ? '💰 Prix' :
                       attr.trait_type === 'Tier Technique' ? '🏆 Niveau' :
                       attr.trait_type === 'Bonus' ? '⚡ Bonus' :
                       attr.trait_type === 'Rarity' ? '💎 Rareté' : attr.trait_type}
                    </div>
                    <div className="text-lg font-bold text-white">
                      {attr.value}
                    </div>
                  </div>
                ))}
            </div>

            {/* Tous les attributs */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center">
                📋 Caractéristiques complètes
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {metadata.attributes.map((attr, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center py-2 px-3 bg-white/5 rounded hover:bg-white/10 transition-colors"
                  >
                    <span className="font-medium text-gray-300 flex items-center">
                      {getAttributeIcon(attr.trait_type)} {attr.trait_type}
                    </span>
                    <span className="text-white font-semibold">
                      {attr.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Site externe si disponible */}
        {metadata.external_url && (
          <div className="mt-4 p-3 bg-blue-900/20 rounded-lg">
            <a 
              href={metadata.external_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline flex items-center"
            >
              🌐 Voir plus d'informations →
            </a>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 flex items-center justify-center">
        <div className="text-white text-xl flex items-center">
          <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mr-3"></div>
          Chargement des NFT...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 p-5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 text-white">
          <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">
            Cartes d'Accès NFT
          </h1>
          <p className="text-xl opacity-90">
            Obtenez vos niveaux de droits d'accès à notre plateforme d'offre de récompenses
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center mb-8">
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-400">
              {error}
            </div>
          </div>
        )}

        {/* NFT Grid - 3 cartes par ligne puis 2 cartes */}
        <div className="space-y-8">
          {/* Première ligne - 3 NFT */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
            {nftConfig.slice(0, 3).map((nft) => {
              const metadata = nftMetadata[nft.id];
              return (
                <div
                  key={nft.id}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer border-2 border-white/20 hover:border-white/40 hover:-translate-y-3 hover:shadow-2xl relative overflow-hidden group max-w-sm w-full"
                  onClick={() => handleCardClick(nft.id)}
                >
                  {/* Effet de brillance au hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  
                  {/* Image NFT depuis Pinata */}
                  <div className="relative z-10">
                    {metadata?.image ? (
                      <div className="w-64 h-64 mx-auto mb-6 rounded-2xl overflow-hidden border-3 border-white/30 group-hover:border-white/60 transition-all duration-300 shadow-lg bg-white/5 flex items-center justify-center p-2">
                        <img
                          src={metadata.image}
                          alt={metadata.name || nft.name}
                          className="max-w-full max-h-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-64 h-64 bg-gray-700/50 rounded-2xl mx-auto mb-6 border-3 border-white/30 flex items-center justify-center">
                        <span className="text-white text-6xl"></span>
                      </div>
                    )}
                    
                    {/* Titre NFT avec nom artistique */}
                    <div className="mb-4">
                      <h2 className="text-white text-2xl font-bold mb-2 leading-tight">
                        {metadata?.attributes?.find(attr => attr.trait_type === 'Nom Artistique')?.value || metadata?.name || nft.name}
                      </h2>
                      <div className="text-gray-300 text-lg font-medium">
                        {metadata?.attributes?.find(attr => attr.trait_type === 'Tier Technique')?.value || nft.level}
                      </div>
                    </div>
                    
                    {/* Prix mis en valeur */}
                    {metadata?.attributes && (
                      <div className="mb-4">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black py-2 px-6 rounded-full text-lg font-bold inline-block shadow-lg">
                          {metadata.attributes.find(attr => attr.trait_type === 'Price')?.value || 'Prix non défini'}
                        </div>
                      </div>
                    )}
                    
                    {/* Description courte */}
                    <div className="text-white/80 text-sm leading-relaxed mb-4 px-2 line-clamp-3">
                      {metadata?.description ? 
                        metadata.description.length > 120 ? 
                          metadata.description.substring(0, 120) + "..." 
                          : metadata.description
                        : 'Description non disponible'
                      }
                    </div>
                    
                    {/* Bonus et éléments clés */}
                    {metadata?.attributes && (
                      <div className="flex justify-center gap-3 mb-4">
                        {metadata.attributes
                          .filter(attr => ['Bonus', 'Rarity'].includes(attr.trait_type))
                          .map((attr, index) => (
                            <div key={index} className="bg-white/20 text-white py-1 px-3 rounded-full text-sm font-semibold">
                              {attr.trait_type === 'Bonus' ? '⚡' : '💎'} {attr.value}
                            </div>
                          ))}
                      </div>
                    )}
                    
                    {/* Bouton stylé pour voir les détails */}
                    <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 mx-auto mb-4">
                      <span>📋</span>
                      <span>Voir les détails</span>
                      <svg 
                        className={`w-4 h-4 transition-transform duration-300 ${activeDropdown === nft.id ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown */}
                    <div
                      className={`mt-6 bg-black/40 backdrop-blur-sm rounded-lg overflow-hidden transition-all duration-500 ${
                        activeDropdown === nft.id ? 'max-h-[600px] p-6 border border-white/20' : 'max-h-0 p-0'
                      }`}
                    >
                      {activeDropdown === nft.id && (
                        <div className="animate-fadeIn">
                          {renderDropdownContent(nft)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deuxième ligne - 2 NFT centrés */}
          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
              {nftConfig.slice(3, 5).map((nft) => {
                const metadata = nftMetadata[nft.id];
                return (
                  <div
                    key={nft.id}
                    className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer border-2 border-white/20 hover:border-white/40 hover:-translate-y-3 hover:shadow-2xl relative overflow-hidden group max-w-sm w-full"
                    onClick={() => handleCardClick(nft.id)}
                  >
                    {/* Effet de brillance au hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    
                    {/* Image NFT depuis Pinata */}
                    <div className="relative z-10">
                      {metadata?.image ? (
                        <div className="w-64 h-64 mx-auto mb-6 rounded-2xl overflow-hidden border-3 border-white/30 group-hover:border-white/60 transition-all duration-300 shadow-lg bg-white/5 flex items-center justify-center p-2">
                          <img
                            src={metadata.image}
                            alt={metadata.name || nft.name}
                            className="max-w-full max-h-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-64 h-64 bg-gray-700/50 rounded-2xl mx-auto mb-6 border-3 border-white/30 flex items-center justify-center">
                          <span className="text-white text-6xl">🎫</span>
                        </div>
                      )}
                      
                      {/* Titre NFT avec nom artistique */}
                      <div className="mb-4">
                        <h2 className="text-white text-2xl font-bold mb-2 leading-tight">
                          {metadata?.attributes?.find(attr => attr.trait_type === 'Nom Artistique')?.value || metadata?.name || nft.name}
                        </h2>
                        <div className="text-gray-300 text-lg font-medium">
                          {metadata?.attributes?.find(attr => attr.trait_type === 'Tier Technique')?.value || nft.level}
                        </div>
                      </div>
                      
                      {/* Prix mis en valeur */}
                      {metadata?.attributes && (
                        <div className="mb-4">
                          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black py-2 px-6 rounded-full text-lg font-bold inline-block shadow-lg">
                            {metadata.attributes.find(attr => attr.trait_type === 'Price')?.value || 'Prix non défini'}
                          </div>
                        </div>
                      )}
                      
                      {/* Description courte */}
                      <div className="text-white/80 text-sm leading-relaxed mb-4 px-2 line-clamp-3">
                        {metadata?.description ? 
                          metadata.description.length > 120 ? 
                            metadata.description.substring(0, 120) + "..." 
                            : metadata.description
                          : 'Description non disponible'
                        }
                      </div>
                      
                      {/* Bonus et éléments clés */}
                      {metadata?.attributes && (
                        <div className="flex justify-center gap-3 mb-4">
                          {metadata.attributes
                            .filter(attr => ['Bonus', 'Rarity'].includes(attr.trait_type))
                            .map((attr, index) => (
                              <div key={index} className="bg-white/20 text-white py-1 px-3 rounded-full text-sm font-semibold">
                                {attr.trait_type === 'Bonus' ? '⚡' : '💎'} {attr.value}
                              </div>
                            ))}
                        </div>
                      )}
                      
                      {/* Bouton stylé pour voir les détails */}
                      <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 mx-auto mb-4">
                        <span>📋</span>
                        <span>Voir les détails</span>
                        <svg 
                          className={`w-4 h-4 transition-transform duration-300 ${activeDropdown === nft.id ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Dropdown */}
                      <div
                        className={`mt-6 bg-black/40 backdrop-blur-sm rounded-lg overflow-hidden transition-all duration-500 ${
                          activeDropdown === nft.id ? 'max-h-[600px] p-6 border border-white/20' : 'max-h-0 p-0'
                        }`}
                      >
                        {activeDropdown === nft.id && (
                          <div className="animate-fadeIn">
                            {renderDropdownContent(nft)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Instructions pour l'utilisation */}
        <div className="mt-12 text-center text-white/80">
          <div className="bg-white/10 rounded-lg p-6 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-6 text-yellow-400">
              🎯 Cartes d'accès aux Collectionx NFT
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-bold text-blue-400 mb-2">🥉 Niveau Entrée</h4>
                <p className="text-sm">Bronze (120 USDC) et Fidelity (GRATUIT) pour débuter</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-bold text-purple-400 mb-2">🥈 Niveau Intermédiaire</h4>
                <p className="text-sm">Silver (250 USDC) pour des stratégies raffinées</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-bold text-yellow-400 mb-2">🥇 Niveau Premium</h4>
                <p className="text-sm">Gold (500 USDC) et Privilege (1000 USDC) pour l'élite</p>
              </div>
            </div>
            <p className="mt-6 text-center italic">
              ✨ Chaque NFT donne accès à des stratégies de récompenses exclusives avec des multiplicateurs uniques
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTCards;