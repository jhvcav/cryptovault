import React from 'react';

const OpenHTMLButton: React.FC = () => {
  const openHTMLFile = () => {
    window.open('/tableau-nft.html', '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={openHTMLFile}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      📄 Ouvrir Tableau PDF
    </button>
  );
};

export default OpenHTMLButton;