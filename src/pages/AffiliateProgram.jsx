import React from 'react';
import './AffiliateProgram.css';

const AffiliateProgram = () => {
  // Les SVG des badges
  const BadgeAffilie = () => (
  <svg className="badge" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="glow-affilie" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      
      <linearGradient id="affilieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:"#ffffff", stopOpacity:1}} />
        <stop offset="50%" style={{stopColor:"#f0f0f0", stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:"#e0e0e0", stopOpacity:1}} />
      </linearGradient>
      
      <radialGradient id="affilieShine" cx="30%" cy="30%" r="60%" fx="30%" fy="30%">
        <stop offset="0%" style={{stopColor:"#ffffff", stopOpacity:0.8}} />
        <stop offset="100%" style={{stopColor:"#ffffff", stopOpacity:0}} />
      </radialGradient>
    </defs>
    
    {/* Contour extérieur avec effet de lueur */}
    <circle cx="70" cy="70" r="65" fill="none" stroke="#a0aec0" strokeWidth="1.5" strokeOpacity="0.7" />
    
    {/* Cercle principal avec dégradé */}
    <circle cx="70" cy="70" r="60" fill="url(#affilieGradient)" stroke="#94a3b8" strokeWidth="3" filter="url(#glow-affilie)" />
    
    {/* Étoile centrale avec effet 3D */}
    <path d="M70,25 L80,55 L112,55 L87,75 L96,105 L70,85 L44,105 L53,75 L28,55 L60,55 Z" 
          fill="#d1d5db" stroke="#94a3b8" strokeWidth="1.5" />
    
    {/* Cercle central avec brillance */}
    <circle cx="70" cy="70" r="30" fill="#f1f5f9" stroke="#d1d5db" strokeWidth="1.5" />
    
    {/* Effet de brillance */}
    <circle cx="70" cy="70" r="55" fill="url(#affilieShine)" />
    
    {/* Petites étoiles décoratives */}
    <path d="M40,40 L42,46 L48,48 L42,50 L40,56 L38,50 L32,48 L38,46 Z" fill="#ffffff" fillOpacity="0.8" />
    <path d="M100,40 L102,46 L108,48 L102,50 L100,56 L98,50 L92,48 L98,46 Z" fill="#ffffff" fillOpacity="0.8" />
    
    {/* Reflet */}
    <ellipse cx="55" cy="55" rx="15" ry="10" fill="#ffffff" fillOpacity="0.4" />
  </svg>
);

  const BadgeQualifie = () => (
  <svg className="badge" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="glow-qualifie" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      
      <linearGradient id="qualifieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:"#e2e8f0", stopOpacity:1}} />
        <stop offset="50%" style={{stopColor:"#cbd5e1", stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:"#94a3b8", stopOpacity:1}} />
      </linearGradient>
      
      <radialGradient id="qualifieShine" cx="30%" cy="30%" r="60%" fx="30%" fy="30%">
        <stop offset="0%" style={{stopColor:"#ffffff", stopOpacity:0.8}} />
        <stop offset="100%" style={{stopColor:"#ffffff", stopOpacity:0}} />
      </radialGradient>
      
      <linearGradient id="qualifieAccent" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:"#bfdbfe", stopOpacity:0.7}} />
        <stop offset="100%" style={{stopColor:"#3b82f6", stopOpacity:0.3}} />
      </linearGradient>
    </defs>
    
    {/* Cercle extérieur animé */}
    <circle cx="70" cy="70" r="65" fill="none" stroke="#64748b" strokeWidth="1.5" strokeOpacity="0.7" />
    
    {/* Cercle principal avec dégradé */}
    <circle cx="70" cy="70" r="60" fill="url(#qualifieGradient)" stroke="#64748b" strokeWidth="3" filter="url(#glow-qualifie)" />
    
    {/* Grande étoile */}
    <path d="M70,25 L80,55 L112,55 L87,75 L96,105 L70,85 L44,105 L53,75 L28,55 L60,55 Z" 
          fill="#94a3b8" stroke="#64748b" strokeWidth="1.5" />
    
    {/* Petites étoiles */}
    <path d="M45,40 L50,55 L65,55 L53,65 L58,80 L45,70 L32,80 L37,65 L25,55 L40,55 Z" 
          fill="url(#qualifieAccent)" stroke="#64748b" strokeWidth="1" />
    <path d="M95,40 L100,55 L115,55 L103,65 L108,80 L95,70 L82,80 L87,65 L75,55 L90,55 Z" 
          fill="url(#qualifieAccent)" stroke="#64748b" strokeWidth="1" />
    
    {/* Cercle central avec numéro */}
    <circle cx="70" cy="70" r="30" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
    <text x="70" y="78" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="#475569" filter="url(#glow-qualifie)">3</text>
    
    {/* Effet de brillance */}
    <circle cx="70" cy="70" r="55" fill="url(#qualifieShine)" />
    
    {/* Reflet */}
    <ellipse cx="55" cy="55" rx="15" ry="10" fill="#ffffff" fillOpacity="0.4" />
  </svg>
);

  const BadgeSilver = () => (
  <svg className="badge" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="glow-silver" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      
      <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:"#f1f5f9", stopOpacity:1}} />
        <stop offset="50%" style={{stopColor:"#cbd5e1", stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:"#94a3b8", stopOpacity:1}} />
      </linearGradient>
      
      <linearGradient id="silverEdge" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:"#f8fafc", stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:"#64748b", stopOpacity:1}} />
      </linearGradient>
      
      <radialGradient id="silverShine" cx="30%" cy="30%" r="70%" fx="20%" fy="20%">
        <stop offset="0%" style={{stopColor:"#ffffff", stopOpacity:0.9}} />
        <stop offset="100%" style={{stopColor:"#ffffff", stopOpacity:0}} />
      </radialGradient>
    </defs>
    
    {/* Cercle extérieur */}
    <circle cx="70" cy="70" r="65" fill="none" stroke="url(#silverEdge)" strokeWidth="2" />
    
    {/* Cercle principal avec dégradé */}
    <circle cx="70" cy="70" r="60" fill="url(#silverGradient)" stroke="#64748b" strokeWidth="3" filter="url(#glow-silver)" />
    
    {/* Forme centrale stylisée */}
    <path d="M70,25 C45,25 30,45 30,70 C30,90 45,115 70,105 C95,115 110,90 110,70 C110,45 95,25 70,25 Z" 
          fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
    
    {/* Étoile intérieure */}
    <path d="M70,40 L76,58 L95,58 L80,68 L85,85 L70,75 L55,85 L60,68 L45,58 L64,58 Z" 
          fill="#e5e7eb" stroke="#64748b" strokeWidth="1" />
    
    {/* Effet de brillance */}
    <circle cx="70" cy="70" r="55" fill="url(#silverShine)" />
    
    {/* Détails métalliques */}
    <path d="M50,35 C60,25 80,25 90,35" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />
    <path d="M30,70 C30,60 35,50 45,40" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.6" />
    <path d="M70,115 C60,115 50,110 40,100" fill="none" stroke="#64748b" strokeWidth="1.5" strokeOpacity="0.6" />
    
    {/* Reflets */}
    <ellipse cx="55" cy="50" rx="12" ry="8" fill="#ffffff" fillOpacity="0.7" />
    <path d="M55,70 L85,70" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.6" />
    <path d="M60,80 L80,80" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.5" />
  </svg>
);

  const BadgeGold = () => (
  <svg className="badge" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="glow-gold" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      
      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:"#fef3c7", stopOpacity:1}} />
        <stop offset="50%" style={{stopColor:"#fcd34d", stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:"#f59e0b", stopOpacity:1}} />
      </linearGradient>
      
      <radialGradient id="goldShine" cx="30%" cy="30%" r="70%" fx="20%" fy="20%">
        <stop offset="0%" style={{stopColor:"#fffbeb", stopOpacity:0.9}} />
        <stop offset="70%" style={{stopColor:"#fcd34d", stopOpacity:0.3}} />
        <stop offset="100%" style={{stopColor:"#fcd34d", stopOpacity:0}} />
      </radialGradient>
      
      <linearGradient id="goldRays" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:"#fef3c7", stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:"#fbbf24", stopOpacity:1}} />
      </linearGradient>
    </defs>
    
    {/* Rayons solaires */}
    <g>
      <line x1="70" y1="5" x2="70" y2="20" stroke="url(#goldRays)" strokeWidth="4" />
      <line x1="70" y1="120" x2="70" y2="135" stroke="url(#goldRays)" strokeWidth="4" />
      <line x1="5" y1="70" x2="20" y2="70" stroke="url(#goldRays)" strokeWidth="4" />
      <line x1="120" y1="70" x2="135" y2="70" stroke="url(#goldRays)" strokeWidth="4" />
      <line x1="26" y1="26" x2="36" y2="36" stroke="url(#goldRays)" strokeWidth="4" />
      <line x1="104" y1="104" x2="114" y2="114" stroke="url(#goldRays)" strokeWidth="4" />
      <line x1="26" y1="114" x2="36" y2="104" stroke="url(#goldRays)" strokeWidth="4" />
      <line x1="104" y1="36" x2="114" y2="26" stroke="url(#goldRays)" strokeWidth="4" />
    </g>
    
    {/* Cercle principal avec dégradé */}
    <circle cx="70" cy="70" r="60" fill="url(#goldGradient)" stroke="#d97706" strokeWidth="3" filter="url(#glow-gold)" />
    
    {/* Forme décorative */}
    <path d="M30,70 C30,45 50,30 70,30 C90,30 110,45 110,70 L105,80 L95,70 L85,85 L70,75 L55,85 L45,70 L35,80 Z" 
          fill="#fcd34d" stroke="#d97706" strokeWidth="2" />
    
    {/* Arc inférieur */}
    <path d="M40,80 L45,95 L95,95 L100,80" fill="none" stroke="#d97706" strokeWidth="2" />
    
    {/* Cercle central */}
    <circle cx="70" cy="70" r="25" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" />
    
    {/* Effet de brillance */}
    <circle cx="70" cy="70" r="55" fill="url(#goldShine)" />
    
    {/* Détails étincelants */}
    <path d="M60,60 L80,80" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.8" />
    <path d="M60,80 L80,60" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.8" />
    <circle cx="70" cy="70" r="3" fill="#ffffff" />
    
    {/* Petites décorations */}
    <circle cx="50" cy="50" r="2" fill="#ffffff" />
    <circle cx="90" cy="50" r="2" fill="#ffffff" />
    <circle cx="50" cy="90" r="2" fill="#ffffff" />
    <circle cx="90" cy="90" r="2" fill="#ffffff" />
    
    {/* Reflet */}
    <ellipse cx="60" cy="65" rx="10" ry="7" fill="#ffffff" fillOpacity="0.7" />
  </svg>
);

  const BadgeDiamant = () => (
  <svg className="badge" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="glow-diamond" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      
      <linearGradient id="diamondGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:"#dbeafe", stopOpacity:1}} />
        <stop offset="50%" style={{stopColor:"#93c5fd", stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:"#3b82f6", stopOpacity:1}} />
      </linearGradient>
      
      <linearGradient id="diamondFacet1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:"#bfdbfe", stopOpacity:0.9}} />
        <stop offset="100%" style={{stopColor:"#60a5fa", stopOpacity:0.6}} />
      </linearGradient>
      
      <linearGradient id="diamondFacet2" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{stopColor:"#dbeafe", stopOpacity:0.9}} />
        <stop offset="100%" style={{stopColor:"#2563eb", stopOpacity:0.6}} />
      </linearGradient>
      
      <radialGradient id="diamondShine" cx="30%" cy="30%" r="70%" fx="10%" fy="10%">
        <stop offset="0%" style={{stopColor:"#ffffff", stopOpacity:0.9}} />
        <stop offset="70%" style={{stopColor:"#eff6ff", stopOpacity:0.3}} />
        <stop offset="100%" style={{stopColor:"#bfdbfe", stopOpacity:0}} />
      </radialGradient>
    </defs>
    
    {/* Éclat externe */}
    <circle cx="70" cy="70" r="65" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeOpacity="0.7" />
    
    {/* Cercle principal avec dégradé */}
    <circle cx="70" cy="70" r="60" fill="url(#diamondGradient)" stroke="#1d4ed8" strokeWidth="3" filter="url(#glow-diamond)" />
    
    {/* Forme de diamant */}
    <path d="M70,25 L100,55 L70,115 L40,55 Z" fill="#60a5fa" stroke="#1d4ed8" strokeWidth="2" />
    
    {/* Facettes du diamant */}
    <path d="M70,25 L100,55 L70,115" fill="url(#diamondFacet1)" stroke="none" />
    <path d="M70,25 L40,55 L70,115" fill="url(#diamondFacet2)" stroke="none" />
    
    {/* Ligne de reflet horizontal */}
    <path d="M55,40 L85,40" stroke="#dbeafe" strokeWidth="2" strokeOpacity="0.8" />
    
    {/* Effet de brillance */}
    <circle cx="70" cy="70" r="55" fill="url(#diamondShine)" opacity="0.6" />
    
    {/* Lignes réfléchissantes */}
    <line x1="70" y1="15" x2="70" y2="10" stroke="#ffffff" strokeWidth="2" />
    <line x1="80" y1="25" x2="85" y2="20" stroke="#ffffff" strokeWidth="2" />
    <line x1="60" y1="25" x2="55" y2="20" stroke="#ffffff" strokeWidth="2" />
    <line x1="110" y1="55" x2="115" y2="50" stroke="#ffffff" strokeWidth="2" />
    <line x1="30" y1="55" x2="25" y2="50" stroke="#ffffff" strokeWidth="2" />
    
    {/* Points brillants */}
    <circle cx="70" cy="25" r="2" fill="#ffffff" />
    <circle cx="70" cy="50" r="1.5" fill="#ffffff" />
    <circle cx="70" cy="75" r="1" fill="#ffffff" />
    <circle cx="85" cy="55" r="1.5" fill="#ffffff" />
    <circle cx="55" cy="55" r="1.5" fill="#ffffff" />
    
    {/* Grand reflet */}
    <ellipse cx="60" cy="45" rx="15" ry="8" fill="#ffffff" fillOpacity="0.8" />
  </svg>
);

  const BadgeBlackDiamant = () => (
  <svg className="badge" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="glow-black-diamond" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feFlood floodColor="#f59e0b" floodOpacity="0.5" result="gold-glow" />
        <feComposite in="gold-glow" in2="blur" operator="in" result="gold-blur" />
        <feComposite in="SourceGraphic" in2="gold-blur" operator="over" />
      </filter>
      
      <linearGradient id="blackDiamondGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:"#4b5563", stopOpacity:1}} />
        <stop offset="50%" style={{stopColor:"#1f2937", stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:"#111827", stopOpacity:1}} />
      </linearGradient>
      
      <linearGradient id="blackDiamondFacet" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:"#374151", stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:"#111827", stopOpacity:1}} />
      </linearGradient>
      
      <linearGradient id="crownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:"#fef3c7", stopOpacity:1}} />
        <stop offset="50%" style={{stopColor:"#fcd34d", stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:"#f59e0b", stopOpacity:1}} />
      </linearGradient>
      
      <radialGradient id="blackDiamondShine" cx="70%" cy="30%" r="70%" fx="60%" fy="20%">
        <stop offset="0%" style={{stopColor:"#9ca3af", stopOpacity:0.7}} />
        <stop offset="70%" style={{stopColor:"#4b5563", stopOpacity:0.2}} />
        <stop offset="100%" style={{stopColor:"#1f2937", stopOpacity:0}} />
      </radialGradient>
    </defs>
    
    {/* Bordure d'or */}
    <circle cx="70" cy="70" r="65" fill="none" stroke="#f59e0b" strokeWidth="2" strokeOpacity="0.6" />
    
    {/* Cercle principal avec dégradé */}
    <circle cx="70" cy="70" r="60" fill="url(#blackDiamondGradient)" stroke="#030712" strokeWidth="3" filter="url(#glow-black-diamond)" />
    
    {/* Forme de diamant noir */}
    <path d="M70,25 L100,55 L70,115 L40,55 Z" fill="#1f2937" stroke="#030712" strokeWidth="2" />
    
    {/* Facettes du diamant */}
    <path d="M70,25 L100,55 L70,115" fill="url(#blackDiamondFacet)" stroke="none" />
    
    {/* Couronne dorée */}
    <path d="M45,25 L55,15 L70,25 L85,15 L95,25 L85,35 L70,25 L55,35 Z" 
          fill="url(#crownGradient)" stroke="#f59e0b" strokeWidth="1.5" />
    
    {/* Effet de brillance */}
    <circle cx="70" cy="70" r="55" fill="url(#blackDiamondShine)" />
    
    {/* Points brillants */}
    <circle cx="70" cy="45" r="2" fill="#ffffff" />
    <circle cx="80" cy="70" r="1.5" fill="#ffffff" />
    <circle cx="58" cy="75" r="1" fill="#ffffff" />
    <circle cx="65" cy="90" r="1" fill="#ffffff" />
    <circle cx="75" cy="90" r="1" fill="#ffffff" />
    
    {/* Détails de la couronne */}
    <circle cx="70" cy="18" r="1.5" fill="#ffffff" />
    <circle cx="55" cy="15" r="1" fill="#ffffff" />
    <circle cx="85" cy="15" r="1" fill="#ffffff" />
    
    {/* Petit reflet */}
    <ellipse cx="60" cy="45" rx="10" ry="5" fill="#ffffff" fillOpacity="0.3" />
    
    {/* Étincelles autour de la couronne */}
    <path d="M52,10 L54,14" stroke="#fef3c7" strokeWidth="0.5" />
    <path d="M88,10 L86,14" stroke="#fef3c7" strokeWidth="0.5" />
    <path d="M70,8 L70,12" stroke="#fef3c7" strokeWidth="0.5" />
  </svg>
);

  // Composant SVG pour la structure du plan d'affiliation
  const AffiliationStructure = () => (
  <svg className="structure-diagram" viewBox="0 0 1000 900" xmlns="http://www.w3.org/2000/svg">
    {/* Fond transparent */}
    <rect width="1000" height="900" fill="rgba(255, 255, 255, 0.3)" rx="10" ry="10" />
    
    {/* Titre */}
    <text x="500" y="40" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="#1e1b4b">Structure de Développement du Plan de Rémunération</text>
    
    {/* Section principale - Structure centrée sans la légende à droite */}
    <g transform="translate(130, 80)">
      {/* Vous */}
      <g transform="translate(370, 20)">
        <rect x="-60" y="-20" width="120" height="40" rx="20" ry="20" fill="#312e81" stroke="#1e1b4b" strokeWidth="2" />
        <text x="0" y="5" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#ffffff">VOUS</text>
        
        {/* Conditions*/}
        <text x="0" y="55" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#ffffff">Affilié Qualifié</text>
        <text x="0" y="75" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fill="#000000">3 affiliés directs + 500$</text>
      </g>
      
      {/* Niveau 1 */}
      <g transform="translate(0, 140)">
        {/* Ligne de connexion verticale */}
        <line x1="370" y1="-40" x2="370" y2="-20" stroke="#3b82f6" strokeWidth="2" />
        
        {/* Ligne horizontale */}
        <line x1="130" y1="-20" x2="610" y2="-20" stroke="#3b82f6" strokeWidth="2" />
        
        {/* Niveau 1 - Membre 1 */}
        <g transform="translate(130, 0)">
          <line x1="0" y1="-20" x2="0" y2="0" stroke="#3b82f6" strokeWidth="2" />
          <circle cx="0" cy="25" r="25" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
          <text x="0" y="30" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">A</text>
          <text x="0" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">Affilié Qualifié</text>
          <text x="0" y="85" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#000000">Commission: 15%</text>
        </g>
        
        {/* Niveau 1 - Membre 2 */}
        <g transform="translate(370, 0)">
          <line x1="0" y1="-20" x2="0" y2="0" stroke="#3b82f6" strokeWidth="2" />
          <circle cx="0" cy="25" r="25" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
          <text x="0" y="30" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">B</text>
          <text x="0" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">Affilié Simple</text>
          <text x="0" y="85" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#000000">Commission: 5%</text>
        </g>
        
        {/* Niveau 1 - Membre 3 */}
        <g transform="translate(610, 0)">
          <line x1="0" y1="-20" x2="0" y2="0" stroke="#3b82f6" strokeWidth="2" />
          <circle cx="0" cy="25" r="25" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
          <text x="0" y="30" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">C</text>
          <text x="0" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">Affilié Qualifié</text>
          <text x="0" y="85" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#000000">Commission: 15%</text>
        </g>
      </g>
      
      {/* Niveau 2 */}
      <g transform="translate(0, 270)">
        {/* Lignes de connexion pour A */}
        <line x1="130" y1="-40" x2="130" y2="-30" stroke="#22c55e" strokeWidth="2" />
        <line x1="70" y1="-30" x2="190" y2="-30" stroke="#22c55e" strokeWidth="2" />
        <line x1="70" y1="-30" x2="70" y2="-10" stroke="#22c55e" strokeWidth="2" />
        <line x1="130" y1="-30" x2="130" y2="-10" stroke="#22c55e" strokeWidth="2" />
        <line x1="190" y1="-30" x2="190" y2="-10" stroke="#22c55e" strokeWidth="2" />
        
        {/* Affiliés de A */}
        <circle cx="70" cy="15" r="25" fill="#22c55e" stroke="#16a34a" strokeWidth="2" />
        <text x="70" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">A1</text>
        <text x="70" y="55" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="#000000">10%</text>
        
        <circle cx="130" cy="15" r="25" fill="#22c55e" stroke="#16a34a" strokeWidth="2" />
        <text x="130" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">A2</text>
        <text x="130" y="55" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="#000000">10%</text>
        
        <circle cx="190" cy="15" r="25" fill="#22c55e" stroke="#16a34a" strokeWidth="2" />
        <text x="190" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">A3</text>
        <text x="190" y="55" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="#000000">10%</text>
        
        {/* Lignes de connexion pour C */}
        <line x1="610" y1="-40" x2="610" y2="-30" stroke="#22c55e" strokeWidth="2" />
        <line x1="550" y1="-30" x2="670" y2="-30" stroke="#22c55e" strokeWidth="2" />
        <line x1="550" y1="-30" x2="550" y2="-10" stroke="#22c55e" strokeWidth="2" />
        <line x1="610" y1="-30" x2="610" y2="-10" stroke="#22c55e" strokeWidth="2" />
        <line x1="670" y1="-30" x2="670" y2="-10" stroke="#22c55e" strokeWidth="2" />
        
        {/* Affiliés de C */}
        <circle cx="550" cy="15" r="25" fill="#22c55e" stroke="#16a34a" strokeWidth="2" />
        <text x="550" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">C1</text>
        <text x="550" y="55" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="#000000">10%</text>
        
        <circle cx="610" cy="15" r="25" fill="#22c55e" stroke="#16a34a" strokeWidth="2" />
        <text x="610" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">C2</text>
        <text x="610" y="55" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="#000000">10%</text>
        
        <circle cx="670" cy="15" r="25" fill="#22c55e" stroke="#16a34a" strokeWidth="2" />
        <text x="670" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">C3</text>
        <text x="670" y="55" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="#000000">10%</text>
      </g>
      
      {/* Niveau 3 (exemple pour A1) */}
      <g transform="translate(0, 380)">
        {/* Lignes de connexion */}
        <line x1="70" y1="-35" x2="70" y2="-15" stroke="#ef4444" strokeWidth="2" />
        <line x1="40" y1="-15" x2="100" y2="-15" stroke="#ef4444" strokeWidth="2" />
        <line x1="40" y1="-15" x2="40" y2="0" stroke="#ef4444" strokeWidth="2" />
        <line x1="70" y1="-15" x2="70" y2="0" stroke="#ef4444" strokeWidth="2" />
        <line x1="100" y1="-15" x2="100" y2="0" stroke="#ef4444" strokeWidth="2" />
        
        {/* Affiliés de niveau 3 */}
        <circle cx="40" cy="25" r="25" fill="#ef4444" stroke="#dc2626" strokeWidth="2" />
        <text x="40" y="30" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">A11</text>
        <text x="40" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="#000000">5%</text>
        
        <circle cx="70" cy="25" r="25" fill="#ef4444" stroke="#dc2626" strokeWidth="2" />
        <text x="70" y="30" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">A12</text>
        <text x="70" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="#000000">5%</text>
        
        <circle cx="100" cy="25" r="25" fill="#ef4444" stroke="#dc2626" strokeWidth="2" />
        <text x="100" y="30" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">A13</text>
        <text x="100" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="#000000">5%</text>
        
        {/* Ligne pointillée indiquant la continuation */}
        <text x="150" y="25" textAnchor="start" fontFamily="Arial, sans-serif" fontSize="16" fill="#1e1b4b">...</text>
        
        {/* Niveaux 4 et 5 indication */}
        <g transform="translate(370, 25)">
          <rect x="-200" y="-20" width="400" height="40" rx="5" ry="5" fill="rgba(255, 255, 255, 0.8)" stroke="#64748b" strokeWidth="1" />
          <text x="0" y="5" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#1e1b4b">Extension aux niveaux 4 (3%) et 5 (2%) avec compression</text>
        </g>
      </g>
      
      {/* Section focus sur qualification - Position corrigée et hauteur augmentée */}
      <g transform="translate(370, 500)">
        <rect x="-320" y="-20" width="640" height="150" rx="10" ry="10" fill="rgba(255, 255, 255, 0.8)" stroke="#64748b" strokeWidth="1" />
        <text x="0" y="10" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#1e1b4b">Processus de Qualification et Développement</text>
        
        {/* Icônes et étapes */}
        <g transform="translate(-240, 60)">
          <circle cx="0" cy="0" r="30" fill="#f1f5f9" stroke="#64748b" strokeWidth="2" />
          <text x="0" y="5" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#1e1b4b">1</text>
          <text x="0" y="45" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#1e1b4b">Inscription</text>
          <text x="0" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#1e1b4b">avec ID sponsor</text>
        </g>
        
        <line x1="-190" y1="60" x2="-130" y2="60" stroke="#64748b" strokeWidth="2" strokeDasharray="5,3" />
        
        <g transform="translate(-80, 60)">
          <circle cx="0" cy="0" r="30" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
          <text x="0" y="5" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#1e1b4b">2</text>
          <text x="0" y="45" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#1e1b4b">Qualification</text>
          <text x="0" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#1e1b4b">3 affiliés + 500$</text>
        </g>
        
        <line x1="-30" y1="60" x2="30" y2="60" stroke="#64748b" strokeWidth="2" strokeDasharray="5,3" />
        
        <g transform="translate(80, 60)">
          <circle cx="0" cy="0" r="30" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
          <text x="0" y="5" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#1e1b4b">3</text>
          <text x="0" y="45" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#1e1b4b">Progression</text>
          <text x="0" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#1e1b4b">Rangs Silver à Black</text>
        </g>
        
        <line x1="130" y1="60" x2="190" y2="60" stroke="#64748b" strokeWidth="2" strokeDasharray="5,3" />
        
        <g transform="translate(240, 60)">
          <circle cx="0" cy="0" r="30" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
          <text x="0" y="5" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#1e1b4b">4</text>
          <text x="0" y="45" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#1e1b4b">Leadership</text>
          <text x="0" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#1e1b4b">Pool de partage 3%</text>
        </g>
      </g>
    </g>
    
    {/* Légende des niveaux complète - Déplacée sous la structure et élargie */}
    <g transform="translate(0, 730)">
      {/* Premier rectangle pour les commissions par niveau */}
      <rect x="100" y="0" width="800" height="70" rx="5" ry="5" fill="rgba(255, 255, 255, 0.85)" stroke="#64748b" strokeWidth="1" />
      <text x="500" y="25" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#000000">Commissions par Niveau</text>
      
      <g transform="translate(150, 50)">
        <circle cx="0" cy="0" r="10" fill="#3b82f6" />
        <text x="30" y="5" textAnchor="start" fontFamily="Arial, sans-serif" fontSize="12" fill="#1e1b4b">Niveau 1: 15%</text>
      </g>
      
      <g transform="translate(300, 50)">
        <circle cx="0" cy="0" r="10" fill="#22c55e" />
        <text x="30" y="5" textAnchor="start" fontFamily="Arial, sans-serif" fontSize="12" fill="#1e1b4b">Niveau 2: 10%</text>
      </g>
      
      <g transform="translate(450, 50)">
        <circle cx="0" cy="0" r="10" fill="#ef4444" />
        <text x="30" y="5" textAnchor="start" fontFamily="Arial, sans-serif" fontSize="12" fill="#1e1b4b">Niveau 3: 5%</text>
      </g>
      
      <g transform="translate(600, 50)">
        <circle cx="0" cy="0" r="10" fill="#f59e0b" />
        <text x="30" y="5" textAnchor="start" fontFamily="Arial, sans-serif" fontSize="12" fill="#1e1b4b">Niveau 4: 3%</text>
      </g>
      
      <g transform="translate(750, 50)">
        <circle cx="0" cy="0" r="10" fill="#8b5cf6" />
        <text x="30" y="5" textAnchor="start" fontFamily="Arial, sans-serif" fontSize="12" fill="#1e1b4b">Niveau 5: 2%</text>
      </g>
      
      {/* Deuxième rectangle pour l'affilié non qualifié */}
      <rect x="300" y="85" width="400" height="50" rx="5" ry="5" fill="rgba(255, 255, 255, 0.85)" stroke="#64748b" strokeWidth="1" />
      
      <g transform="translate(500, 110)">
        <rect x="-120" y="-15" width="240" height="30" rx="15" ry="15" fill="#f1f5f9" stroke="#64748b" strokeWidth="1" />
        <text x="0" y="5" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fill="#1e1b4b">Affilié non qualifié</text>
      </g>
    </g>
  </svg>
);

  
  return (
    <div className="affiliate-program-container">
      <h1>Plan de Rémunération Marketing d'Affiliation pour Investisseurs</h1>
      
      {/* Structure du plan d'affiliation */}
      <div className="structure-container">
        <AffiliationStructure />
      </div>
      
      <div className="note">
        <p><strong>Note importante:</strong> Pour accéder aux commissions sur 5 niveaux, l'affilié doit être qualifié (3 affiliés directs + investissement de 500$)</p>
      </div>
      
      <h2>Tableau des Commissions</h2>
      <table>
        <thead>
          <tr>
            <th>Niveau</th>
            <th>Statut Requis</th>
            <th>Relation</th>
            <th>Taux de Commission</th>
            <th>Conditions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Affilié</td>
            <td>Affiliés directs</td>
            <td>5%</td>
            <td>Aucune qualification requise</td>
          </tr>
          <tr className="highlight">
            <td>1</td>
            <td>Affilié Qualifié</td>
            <td>Affiliés directs</td>
            <td><strong>15%</strong></td>
            <td>Avoir 3 affiliés directs + investissement de 500$</td>
          </tr>
          <tr>
            <td>2</td>
            <td>Affilié Qualifié</td>
            <td>2ème génération</td>
            <td>10%</td>
            <td>Avoir 3 affiliés directs + investissement de 500$</td>
          </tr>
          <tr>
            <td>3</td>
            <td>Affilié Qualifié</td>
            <td>3ème génération</td>
            <td>5%</td>
            <td>Avoir 3 affiliés directs + investissement de 500$</td>
          </tr>
          <tr>
            <td>4</td>
            <td>Affilié Qualifié</td>
            <td>4ème génération</td>
            <td>3%</td>
            <td>Avoir 3 affiliés directs + investissement de 500$</td>
          </tr>
          <tr>
            <td>5</td>
            <td>Affilié Qualifié</td>
            <td>5ème génération</td>
            <td>2%</td>
            <td>Avoir 3 affiliés directs + investissement de 500$</td>
          </tr>
        </tbody>
      </table>
      
      <div className="note">
        <p><strong>Note importante sur la progression</strong>: Tout affilié commence avec un taux de commission de 5% sur ses affiliés directs. Dès qu'il remplit les conditions de qualification (3 affiliés directs + investissement de 500$), son statut évolue automatiquement vers 'Affilié Qualifié', son taux de commission sur TOUS ses affiliés directs (y compris ceux recrutés avant sa qualification) passe à 15%, et il gagne l'accès aux commissions sur les niveaux 2 à 5.</p>
      </div>
      
      <h2>Tableau des Rangs</h2>
      <table>
        <thead>
          <tr>
            <th>Badge</th>
            <th>Rang</th>
            <th>Conditions de Qualification</th>
            <th>Avantages</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="badge-cell"><BadgeAffilie /></td>
            <td><strong>Affilié</strong></td>
            <td>Inscription avec ID de sponsor</td>
            <td>
              <ul className="advantages">
                <li>Accès aux plans d'investissement</li>
                <li>5% de commission sur affiliés directs</li>
                <li>Rendements sur investissements</li>
              </ul>
            </td>
          </tr>
          <tr className="highlight">
            <td className="badge-cell"><BadgeQualifie /></td>
            <td><strong>Affilié Qualifié</strong></td>
            <td>
              <ul className="advantages">
                <li>3 affiliés directs</li>
                <li>Investissement personnel de 500$</li>
              </ul>
            </td>
            <td>
              <ul className="advantages">
                <li>Commissions sur 5 niveaux</li>
                <li>Accès aux outils marketing de base</li>
                <li>Prime de qualification de 100€</li>
              </ul>
            </td>
          </tr>
          <tr>
            <td className="badge-cell"><BadgeSilver /></td>
            <td><strong>Affilié Silver</strong></td>
            <td>
              <ul className="advantages">
                <li>5 affiliés directs actifs</li>
                <li>1000€ de volume d'investissement mensuel</li>
              </ul>
            </td>
            <td>
              <ul className="advantages">
                <li>Tous les avantages précédents</li>
                <li>+1% de commission sur tous les niveaux</li>
                <li>Accès aux stratégies d'investissement intermédiaires</li>
                <li>Prime de rang de 200€</li>
              </ul>
            </td>
          </tr>
          <tr>
            <td className="badge-cell"><BadgeGold /></td>
            <td><strong>Affilié Gold</strong></td>
            <td>
              <ul className="advantages">
                <li>10 affiliés directs actifs</li>
                <li>5000€ de volume d'investissement mensuel</li>
              </ul>
            </td>
            <td>
              <ul className="advantages">
                <li>Tous les avantages précédents</li>
                <li>+1.5% de commission sur tous les niveaux</li>
                <li>Participation au pool de partage (1%)</li>
                <li>Accès aux stratégies d'investissement avancées</li>
                <li>Prime de rang de 500€</li>
              </ul>
            </td>
          </tr>
          <tr>
            <td className="badge-cell"><BadgeDiamant /></td>
            <td><strong>Affilié Diamond</strong></td>
            <td>
              <ul className="advantages">
                <li>20 affiliés directs actifs</li>
                <li>15000€ de volume d'investissement mensuel</li>
              </ul>
            </td>
            <td>
              <ul className="advantages">
                <li>Tous les avantages précédents</li>
                <li>+2% de commission sur tous les niveaux</li>
                <li>Participation au pool de partage (2%)</li>
                <li>Accès aux événements VIP pour investisseurs</li>
                <li>Prime de rang de 1000€</li>
              </ul>
            </td>
          </tr>
          <tr>
            <td className="badge-cell"><BadgeBlackDiamant /></td>
            <td><strong>Affilié Black Diamond</strong></td>
            <td>
              <ul className="advantages">
                <li>50 affiliés directs actifs</li>
                <li>50000€ de volume d'investissement mensuel</li>
              </ul>
            </td>
            <td>
              <ul className="advantages">
                <li>Tous les avantages précédents</li>
                <li>+3% de commission sur tous les niveaux</li>
                <li>Participation au pool de partage (3%)</li>
                <li>Conférences exclusives d'investissement</li>
                <li>Conseiller financier personnel dédié</li>
                <li>Prime de rang de 5000€</li>
              </ul>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Tableau des Bonus</h2>
      <table>
        <thead>
          <tr>
            <th>Type de Bonus</th>
            <th>Qualification</th>
            <th>Montant/Taux</th>
            <th>Fréquence</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Bonus de Qualification</strong></td>
            <td>Atteindre le statut d'Affilié Qualifié</td>
            <td>100€</td>
            <td>Unique</td>
          </tr>
          <tr>
            <td><strong>Bonus de Démarrage Rapide</strong></td>
            <td>Affilié direct qui réalise son 1er investissement dans les 30 jours</td>
            <td>50€ par affilié</td>
            <td>À chaque qualification</td>
          </tr>
          <tr>
            <td><strong>Bonus de Fidélité</strong></td>
            <td>6 mois d'activité continue</td>
            <td>+2% sur toutes les commissions</td>
            <td>Permanent après qualification</td>
          </tr>
          <tr>
            <td rowSpan="5"><strong>Bonus de Volume d'Investissement</strong></td>
            <td>Volume de réseau de 2000€</td>
            <td>100€</td>
            <td>Mensuel</td>
          </tr>
          <tr>
            <td>Volume de réseau de 5000€</td>
            <td>300€</td>
            <td>Mensuel</td>
          </tr>
          <tr>
            <td>Volume de réseau de 10000€</td>
            <td>700€</td>
            <td>Mensuel</td>
          </tr>
          <tr>
            <td>Volume de réseau de 25000€</td>
            <td>2000€</td>
            <td>Mensuel</td>
          </tr>
          <tr>
            <td>Volume de réseau de 50000€</td>
            <td>5000€</td>
            <td>Mensuel</td>
          </tr>
          <tr>
            <td><strong>Bonus de Parité</strong></td>
            <td>Égaler le rang d'un affilié de votre lignée</td>
            <td>10% du bonus de rang de l'affilié</td>
            <td>Unique par affilié égalé</td>
          </tr>
          <tr>
            <td><strong>Bonus de Développement</strong></td>
            <td>Aider un affilié direct à atteindre le rang d'Affilié Qualifié</td>
            <td>75€ par affilié</td>
            <td>À chaque qualification</td>
          </tr>
          <tr>
            <td><strong>Pool de Partage des Revenus</strong></td>
            <td>Rang Gold et supérieur</td>
            <td>3% du volume d'investissement global réparti selon le rang</td>
            <td>Mensuel</td>
          </tr>
        </tbody>
      </table>

      <div className="note">
        <p><strong>Note:</strong> Les affiliés actifs sont définis comme ceux ayant réalisé au moins un investissement ou un recrutement dans les 30 derniers jours. Le volume mensuel inclut les investissements personnels et ceux de l'ensemble du réseau en aval.</p>
        <p>Les rendements des plans d'investissement sont distincts et s'appliquent indépendamment du plan de rémunération.</p>
      </div>
    </div>
  );
};

export default AffiliateProgram;