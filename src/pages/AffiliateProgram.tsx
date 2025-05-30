import React from 'react';
import './AffiliateProgram.css';

const AffiliateProgram = () => {
  // Les SVG des badges directement importés du HTML source
  const BadgeAffilie = () => (
    <svg className="badge" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="affilieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:"#f0f0f0", stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:"#d1d5db", stopOpacity:1}} />
        </linearGradient>
      </defs>
      <circle cx="70" cy="70" r="60" fill="url(#affilieGradient)" stroke="#94a3b8" strokeWidth="2" />
      <path d="M70,25 L80,55 L112,55 L87,75 L96,105 L70,85 L44,105 L53,75 L28,55 L60,55 Z" 
            fill="#d1d5db" stroke="#94a3b8" strokeWidth="1.5" />
      <circle cx="70" cy="70" r="30" fill="#f1f5f9" stroke="#d1d5db" strokeWidth="1" />
      <ellipse cx="55" cy="55" rx="10" ry="7" fill="#ffffff" fillOpacity="0.4" />
    </svg>
  );

  const BadgeQualifie = () => (
    <svg className="badge" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="qualifieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:"#e2e8f0", stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:"#94a3b8", stopOpacity:1}} />
        </linearGradient>
      </defs>
      <circle cx="70" cy="70" r="60" fill="url(#qualifieGradient)" stroke="#64748b" strokeWidth="2" />
      <path d="M70,25 L80,55 L112,55 L87,75 L96,105 L70,85 L44,105 L53,75 L28,55 L60,55 Z" 
            fill="#94a3b8" stroke="#64748b" strokeWidth="1.5" />
      <path d="M45,40 L50,55 L65,55 L53,65 L58,80 L45,70 L32,80 L37,65 L25,55 L40,55 Z" 
            fill="#94a3b8" stroke="#64748b" strokeWidth="1" />
      <path d="M95,40 L100,55 L115,55 L103,65 L108,80 L95,70 L82,80 L87,65 L75,55 L90,55 Z" 
            fill="#94a3b8" stroke="#64748b" strokeWidth="1" />
      <circle cx="70" cy="70" r="30" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
      <text x="70" y="78" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="#64748b">3</text>
      <ellipse cx="55" cy="55" rx="10" ry="7" fill="#ffffff" fillOpacity="0.5" />
    </svg>
  );

  const BadgeSilver = () => (
    <svg className="badge" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:"#e5e7eb", stopOpacity:1}} />
          <stop offset="50%" style={{stopColor:"#cbd5e1", stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:"#94a3b8", stopOpacity:1}} />
        </linearGradient>
      </defs>
      <circle cx="70" cy="70" r="60" fill="url(#silverGradient)" stroke="#64748b" strokeWidth="3" />
      <path d="M70,25 C45,25 30,45 30,70 C30,90 45,115 70,105 C95,115 110,90 110,70 C110,45 95,25 70,25 Z" 
            fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
      <path d="M70,40 L76,58 L95,58 L80,68 L85,85 L70,75 L55,85 L60,68 L45,58 L64,58 Z" 
            fill="#e5e7eb" stroke="#94a3b8" strokeWidth="1" />
      <ellipse cx="55" cy="50" rx="12" ry="8" fill="#ffffff" fillOpacity="0.7" />
      <path d="M55,70 L85,70" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.6" />
      <path d="M60,80 L80,80" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.5" />
    </svg>
  );

  const BadgeGold = () => (
    <svg className="badge" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:"#fef3c7", stopOpacity:1}} />
          <stop offset="50%" style={{stopColor:"#fcd34d", stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:"#f59e0b", stopOpacity:1}} />
        </linearGradient>
      </defs>
      <circle cx="70" cy="70" r="60" fill="url(#goldGradient)" stroke="#f59e0b" strokeWidth="3" />
      <path d="M30,70 C30,45 50,30 70,30 C90,30 110,45 110,70 L105,80 L95,70 L85,85 L70,75 L55,85 L45,70 L35,80 Z" 
            fill="#fcd34d" stroke="#f59e0b" strokeWidth="2" />
      <path d="M40,80 L45,95 L95,95 L100,80" fill="none" stroke="#f59e0b" strokeWidth="2" />
      <circle cx="70" cy="70" r="25" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
      <line x1="70" y1="10" x2="70" y2="25" stroke="#fef3c7" strokeWidth="2" />
      <line x1="70" y1="115" x2="70" y2="130" stroke="#fef3c7" strokeWidth="2" />
      <line x1="10" y1="70" x2="25" y2="70" stroke="#fef3c7" strokeWidth="2" />
      <line x1="115" y1="70" x2="130" y2="70" stroke="#fef3c7" strokeWidth="2" />
      <line x1="28" y1="28" x2="38" y2="38" stroke="#fef3c7" strokeWidth="2" />
      <line x1="102" y1="102" x2="112" y2="112" stroke="#fef3c7" strokeWidth="2" />
      <line x1="28" y1="112" x2="38" y2="102" stroke="#fef3c7" strokeWidth="2" />
      <line x1="102" y1="38" x2="112" y2="28" stroke="#fef3c7" strokeWidth="2" />
      <ellipse cx="60" cy="65" rx="10" ry="7" fill="#ffffff" fillOpacity="0.7" />
    </svg>
  );

  const BadgeDiamant = () => (
    <svg className="badge" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="diamondGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:"#bfdbfe", stopOpacity:1}} />
          <stop offset="50%" style={{stopColor:"#60a5fa", stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:"#3b82f6", stopOpacity:1}} />
        </linearGradient>
      </defs>
      <circle cx="70" cy="70" r="60" fill="url(#diamondGradient)" stroke="#2563eb" strokeWidth="3" />
      <path d="M70,25 L100,55 L70,115 L40,55 Z" fill="#60a5fa" stroke="#2563eb" strokeWidth="2" />
      <path d="M70,25 L100,55 L70,115" fill="#93c5fd" stroke="none" />
      <path d="M55,40 L85,40" stroke="#dbeafe" strokeWidth="2" strokeOpacity="0.8" />
      <line x1="70" y1="15" x2="70" y2="10" stroke="#ffffff" strokeWidth="2" />
      <line x1="80" y1="25" x2="85" y2="20" stroke="#ffffff" strokeWidth="2" />
      <line x1="60" y1="25" x2="55" y2="20" stroke="#ffffff" strokeWidth="2" />
      <line x1="110" y1="55" x2="115" y2="50" stroke="#ffffff" strokeWidth="2" />
      <line x1="30" y1="55" x2="25" y2="50" stroke="#ffffff" strokeWidth="2" />
      <ellipse cx="60" cy="45" rx="15" ry="8" fill="#ffffff" fillOpacity="0.8" />
    </svg>
  );

  const BadgeBlackDiamant = () => (
    <svg className="badge" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="blackDiamondGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:"#4b5563", stopOpacity:1}} />
          <stop offset="50%" style={{stopColor:"#1f2937", stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:"#111827", stopOpacity:1}} />
        </linearGradient>
      </defs>
      <circle cx="70" cy="70" r="60" fill="url(#blackDiamondGradient)" stroke="#111827" strokeWidth="3" />
      <path d="M70,25 L100,55 L70,115 L40,55 Z" fill="#1f2937" stroke="#111827" strokeWidth="2" />
      <path d="M70,25 L100,55 L70,115" fill="#374151" stroke="none" />
      <path d="M45,25 L55,15 L70,25 L85,15 L95,25 L85,35 L70,25 L55,35 Z" 
            fill="#fcd34d" stroke="#f59e0b" strokeWidth="1.5" />
      <circle cx="70" cy="45" r="2" fill="#ffffff" />
      <circle cx="80" cy="70" r="1.5" fill="#ffffff" />
      <circle cx="58" cy="75" r="1" fill="#ffffff" />
      <ellipse cx="60" cy="45" rx="10" ry="5" fill="#ffffff" fillOpacity="0.3" />
    </svg>
  );

  // Composant SVG pour la structure du plan d'affiliation
  const AffiliationStructure = () => (
    <svg className="structure-diagram" viewBox="0 0 1000 800" xmlns="http://www.w3.org/2000/svg">
      {/* Fond */}
      <rect width="1000" height="800" fill="#f5f8fa" />
      
      {/* Titre */}
      <text x="500" y="40" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="#2c3e50">Structure de Développement du Plan de Rémunération</text>
      
      {/* Section principale */}
      <g transform="translate(50, 80)">
        {/* Légende des niveaux */}
        <rect x="750" y="30" width="160" height="280" rx="5" ry="5" fill="#ffffff" stroke="#ddd" strokeWidth="1" />
        <text x="830" y="55" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#2c3e50">Commissions</text>
        <line x1="770" y1="70" x2="890" y2="70" stroke="#ddd" strokeWidth="1" />
        
        <circle cx="780" cy="95" r="10" fill="#3498db" />
        <text x="830" y="100" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fill="#2c3e50">Niveau 1: 15%</text>
        
        <circle cx="780" cy="130" r="10" fill="#2ecc71" />
        <text x="830" y="135" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fill="#2c3e50">Niveau 2: 10%</text>
        
        <circle cx="780" cy="165" r="10" fill="#e74c3c" />
        <text x="830" y="170" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fill="#2c3e50">Niveau 3: 5%</text>
        
        <circle cx="780" cy="200" r="10" fill="#f39c12" />
        <text x="830" y="205" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fill="#2c3e50">Niveau 4: 3%</text>
        
        <circle cx="780" cy="235" r="10" fill="#9b59b6" />
        <text x="830" y="240" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fill="#2c3e50">Niveau 5: 2%</text>
        
        <rect x="770" y="265" width="120" height="30" rx="15" ry="15" fill="#ecf0f1" stroke="#bdc3c7" strokeWidth="1" />
        <text x="830" y="285" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fill="#7f8c8d">Affilié non qualifié</text>
        
        {/* Légende des rangs */}
        <rect x="750" y="330" width="160" height="260" rx="5" ry="5" fill="#ffffff" stroke="#ddd" strokeWidth="1" />
        <text x="830" y="355" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#2c3e50">Progression des Rangs</text>
        <line x1="770" y1="370" x2="890" y2="370" stroke="#ddd" strokeWidth="1" />
        
        <rect x="770" y="390" width="120" height="22" rx="3" ry="3" fill="#e0e0e0" stroke="#bdc3c7" strokeWidth="1" />
        <text x="830" y="405" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#2c3e50">Affilié</text>
        
        <rect x="770" y="425" width="120" height="22" rx="3" ry="3" fill="#d6eaf8" stroke="#7fb3d5" strokeWidth="1" />
        <text x="830" y="440" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#2c3e50">Affilié Qualifié</text>
        
        <rect x="770" y="460" width="120" height="22" rx="3" ry="3" fill="#e8eef1" stroke="#7d8f9e" strokeWidth="1" />
        <text x="830" y="475" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#2c3e50">Affilié Silver</text>
        
        <rect x="770" y="495" width="120" height="22" rx="3" ry="3" fill="#fdebd0" stroke="#f39c12" strokeWidth="1" />
        <text x="830" y="510" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#2c3e50">Affilié Gold</text>
        
        <rect x="770" y="530" width="120" height="22" rx="3" ry="3" fill="#d4e6f1" stroke="#3498db" strokeWidth="1" />
        <text x="830" y="545" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#2c3e50">Affilié Diamond</text>
        
        <rect x="770" y="565" width="120" height="22" rx="3" ry="3" fill="#333333" stroke="#1c1c1c" strokeWidth="1" />
        <text x="830" y="580" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#ffffff">Affilié Black Diamond</text>
        
        {/* Structure principale */}
        {/* Niveau 0 (Vous) */}
        <g transform="translate(370, 20)">
          <rect x="-60" y="-20" width="120" height="40" rx="20" ry="20" fill="#34495e" stroke="#2c3e50" strokeWidth="2" />
          <text x="0" y="5" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#ffffff">VOUS</text>
          
          {/* Conditions*/}
          <text x="0" y="55" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#34495e">Affilié Qualifié</text>
          <text x="0" y="75" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fill="#7f8c8d">3 affiliés directs + 500$</text>
        </g>
        
        {/* Niveau 1 */}
        <g transform="translate(0, 140)">
          {/* Ligne de connexion verticale */}
          <line x1="370" y1="-60" x2="370" y2="-20" stroke="#3498db" strokeWidth="2" />
          
          {/* Ligne horizontale */}
          <line x1="130" y1="-20" x2="610" y2="-20" stroke="#3498db" strokeWidth="2" />
          
          {/* Niveau 1 - Membre 1 */}
          <g transform="translate(130, 0)">
            <line x1="0" y1="-20" x2="0" y2="0" stroke="#3498db" strokeWidth="2" />
            <circle cx="0" cy="25" r="25" fill="#3498db" stroke="#2980b9" strokeWidth="2" />
            <text x="0" y="30" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">A</text>
            <text x="0" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fill="#3498db">Affilié Qualifié</text>
            <text x="0" y="85" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#7f8c8d">Commission: 15%</text>
          </g>
          
          {/* Niveau 1 - Membre 2 */}
          <g transform="translate(370, 0)">
            <line x1="0" y1="-20" x2="0" y2="0" stroke="#3498db" strokeWidth="2" />
            <circle cx="0" cy="25" r="25" fill="#3498db" stroke="#2980b9" strokeWidth="2" />
            <text x="0" y="30" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">B</text>
            <text x="0" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fill="#3498db">Affilié Simple</text>
            <text x="0" y="85" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#7f8c8d">Commission: 5%</text>
          </g>
          
          {/* Niveau 1 - Membre 3 */}
          <g transform="translate(610, 0)">
            <line x1="0" y1="-20" x2="0" y2="0" stroke="#3498db" strokeWidth="2" />
            <circle cx="0" cy="25" r="25" fill="#3498db" stroke="#2980b9" strokeWidth="2" />
            <text x="0" y="30" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">C</text>
            <text x="0" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fill="#3498db">Affilié Qualifié</text>
            <text x="0" y="85" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#7f8c8d">Commission: 15%</text>
          </g>
        </g>
        
        {/* Niveau 2 */}
        <g transform="translate(0, 270)">
          {/* Lignes de connexion pour A */}
          <line x1="130" y1="-70" x2="130" y2="-30" stroke="#2ecc71" strokeWidth="2" />
          <line x1="70" y1="-30" x2="190" y2="-30" stroke="#2ecc71" strokeWidth="2" />
          <line x1="70" y1="-30" x2="70" y2="-10" stroke="#2ecc71" strokeWidth="2" />
          <line x1="130" y1="-30" x2="130" y2="-10" stroke="#2ecc71" strokeWidth="2" />
          <line x1="190" y1="-30" x2="190" y2="-10" stroke="#2ecc71" strokeWidth="2" />
          
          {/* Affiliés de A */}
          <circle cx="70" cy="15" r="25" fill="#2ecc71" stroke="#27ae60" strokeWidth="2" />
          <text x="70" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">A1</text>
          <text x="70" y="55" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#7f8c8d">10%</text>
          
          <circle cx="130" cy="15" r="25" fill="#2ecc71" stroke="#27ae60" strokeWidth="2" />
          <text x="130" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">A2</text>
          <text x="130" y="55" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#7f8c8d">10%</text>
          
          <circle cx="190" cy="15" r="25" fill="#2ecc71" stroke="#27ae60" strokeWidth="2" />
          <text x="190" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">A3</text>
          <text x="190" y="55" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#7f8c8d">10%</text>
          
          {/* Lignes de connexion pour B */}
          <line x1="370" y1="-70" x2="370" y2="-30" stroke="#2ecc71" strokeWidth="2" />
          <line x1="310" y1="-30" x2="430" y2="-30" stroke="#2ecc71" strokeWidth="2" />
          <line x1="310" y1="-30" x2="310" y2="-10" stroke="#2ecc71" strokeWidth="2" />
          <line x1="370" y1="-30" x2="370" y2="-10" stroke="#2ecc71" strokeWidth="2" />
          <line x1="430" y1="-30" x2="430" y2="-10" stroke="#2ecc71" strokeWidth="2" />
          
          {/* Affiliés de B */}
          <circle cx="310" cy="15" r="25" fill="#2ecc71" stroke="#27ae60" strokeWidth="2" />
          <text x="310" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">B1</text>
          <text x="310" y="55" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#7f8c8d">10%</text>
          
          <circle cx="370" cy="15" r="25" fill="#2ecc71" stroke="#27ae60" strokeWidth="2" />
          <text x="370" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">B2</text>
          <text x="370" y="55" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#7f8c8d">10%</text>
          
          <circle cx="430" cy="15" r="25" fill="#2ecc71" stroke="#27ae60" strokeWidth="2" />
          <text x="430" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">B3</text>
          <text x="430" y="55" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#7f8c8d">10%</text>
          
          {/* Lignes de connexion pour C */}
          <line x1="610" y1="-70" x2="610" y2="-30" stroke="#2ecc71" strokeWidth="2" />
          <line x1="550" y1="-30" x2="670" y2="-30" stroke="#2ecc71" strokeWidth="2" />
          <line x1="550" y1="-30" x2="550" y2="-10" stroke="#2ecc71" strokeWidth="2" />
          <line x1="610" y1="-30" x2="610" y2="-10" stroke="#2ecc71" strokeWidth="2" />
          <line x1="670" y1="-30" x2="670" y2="-10" stroke="#2ecc71" strokeWidth="2" />
          
          {/* Affiliés de C */}
          <circle cx="550" cy="15" r="25" fill="#2ecc71" stroke="#27ae60" strokeWidth="2" />
          <text x="550" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">C1</text>
          <text x="550" y="55" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#7f8c8d">10%</text>
          
          <circle cx="610" cy="15" r="25" fill="#2ecc71" stroke="#27ae60" strokeWidth="2" />
          <text x="610" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">C2</text>
          <text x="610" y="55" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#7f8c8d">10%</text>
          
          <circle cx="670" cy="15" r="25" fill="#2ecc71" stroke="#27ae60" strokeWidth="2" />
          <text x="670" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">C3</text>
          <text x="670" y="55" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#7f8c8d">10%</text>
        </g>
        
        {/* Niveau 3 (exemple pour A1) */}
        <g transform="translate(0, 380)">
          {/* Lignes de connexion */}
          <line x1="70" y1="-35" x2="70" y2="-15" stroke="#e74c3c" strokeWidth="2" />
          <line x1="40" y1="-15" x2="100" y2="-15" stroke="#e74c3c" strokeWidth="2" />
          <line x1="40" y1="-15" x2="40" y2="0" stroke="#e74c3c" strokeWidth="2" />
          <line x1="70" y1="-15" x2="70" y2="0" stroke="#e74c3c" strokeWidth="2" />
          <line x1="100" y1="-15" x2="100" y2="0" stroke="#e74c3c" strokeWidth="2" />
          
          {/* Affiliés de niveau 3 */}
          <circle cx="40" cy="25" r="25" fill="#e74c3c" stroke="#c0392b" strokeWidth="2" />
          <text x="40" y="30" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">A11</text>
          <text x="40" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#7f8c8d">5%</text>
          
          <circle cx="70" cy="25" r="25" fill="#e74c3c" stroke="#c0392b" strokeWidth="2" />
          <text x="70" y="30" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">A12</text>
          <text x="70" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#7f8c8d">5%</text>
          
          <circle cx="100" cy="25" r="25" fill="#e74c3c" stroke="#c0392b" strokeWidth="2" />
          <text x="100" y="30" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">A13</text>
          <text x="100" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#7f8c8d">5%</text>
          
          {/* Ligne pointillée indiquant la continuation */}
          <text x="150" y="25" textAnchor="start" fontFamily="Arial, sans-serif" fontSize="16" fill="#7f8c8d">...</text>
          
          {/* Niveaux 4 et 5 indication */}
          <g transform="translate(370, 25)">
            <rect x="-200" y="-20" width="400" height="40" rx="5" ry="5" fill="#f8f9fa" stroke="#ddd" strokeWidth="1" />
            <text x="0" y="5" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fill="#7f8c8d">Extension aux niveaux 4 (3%) et 5 (2%) avec compression</text>
          </g>
        </g>
        
        {/* Section focus sur qualification */}
        <g transform="translate(370, 500)">
          <rect x="-320" y="-20" width="640" height="150" rx="10" ry="10" fill="#ffffff" stroke="#ddd" strokeWidth="1" />
          <text x="0" y="10" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#2c3e50">Processus de Qualification et Développement</text>
          
          {/* Icônes et étapes */}
          <g transform="translate(-240, 60)">
            <circle cx="0" cy="0" r="30" fill="#ecf0f1" stroke="#bdc3c7" strokeWidth="2" />
            <text x="0" y="5" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#7f8c8d">1</text>
            <text x="0" y="45" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fill="#7f8c8d">Inscription</text>
            <text x="0" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#7f8c8d">avec ID sponsor</text>
          </g>
          
          <line x1="-190" y1="60" x2="-130" y2="60" stroke="#bdc3c7" strokeWidth="2" strokeDasharray="5,3" />
          
          <g transform="translate(-80, 60)">
            <circle cx="0" cy="0" r="30" fill="#d6eaf8" stroke="#7fb3d5" strokeWidth="2" />
            <text x="0" y="5" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#3498db">2</text>
            <text x="0" y="45" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fill="#3498db">Qualification</text>
            <text x="0" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#7f8c8d">3 affiliés + 500$</text>
          </g>
          
          <line x1="-30" y1="60" x2="30" y2="60" stroke="#bdc3c7" strokeWidth="2" strokeDasharray="5,3" />
          
          <g transform="translate(80, 60)">
            <circle cx="0" cy="0" r="30" fill="#e8eef1" stroke="#7d8f9e" strokeWidth="2" />
            <text x="0" y="5" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#7d8f9e">3</text>
            <text x="0" y="45" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fill="#7d8f9e">Progression</text>
            <text x="0" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#7f8c8d">Rangs Silver à Black</text>
          </g>
          
          <line x1="130" y1="60" x2="190" y2="60" stroke="#bdc3c7" strokeWidth="2" strokeDasharray="5,3" />
          
          <g transform="translate(240, 60)">
            <circle cx="0" cy="0" r="30" fill="#fdebd0" stroke="#f39c12" strokeWidth="2" />
            <text x="0" y="5" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#f39c12">4</text>
            <text x="0" y="45" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fill="#f39c12">Leadership</text>
            <text x="0" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fill="#7f8c8d">Pool de partage 3%</text>
          </g>
        </g>
        
      {/* Note explicative */}
        <rect x="50" y="670" width="640" height="60" rx="5" ry="5" fill="#f8f9fa" stroke="#ddd" strokeWidth="1" />
        <text x="370" y="690" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontStyle="italic" fill="#7f8c8d">Pour accéder aux commissions sur 5 niveaux, l'affilié doit être qualifié (3 affiliés directs + investissement de 500$)</text>
        <text x="370" y="710" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontStyle="italic" fill="#7f8c8d">Note: Les rendements des plans d'investissement sont distincts et s'appliquent indépendamment du plan de rémunération.</text>
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
            <td>15%</td>
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
      </div>
    </div>
  );
};

export default AffiliateProgram;
