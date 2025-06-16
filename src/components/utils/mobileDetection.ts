export const detectMobileAndMetaMask = () => {
  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isMetaMaskBrowser = /MetaMask/i.test(userAgent);
  const isSmallScreen = window.innerWidth <= 768;
  
  return {
    isMobile,
    isMetaMaskBrowser,
    isSmallScreen,
    shouldUseMobileMode: isMobile || isSmallScreen
  };
};

// Force les breakpoints Chakra UI
export const forceMobileBreakpoints = () => {
  if (detectMobileAndMetaMask().shouldUseMobileMode) {
    // Force le document à avoir une classe mobile
    document.documentElement.classList.add('chakra-mobile-forced');
    
    // Injecte du CSS pour forcer les breakpoints
    const style = document.createElement('style');
    style.textContent = `
      .chakra-mobile-forced {
        --chakra-breakpoint: base !important;
      }
    `;
    document.head.appendChild(style);
    
    // Force window.innerWidth pour que Chakra UI détecte mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 360
    });
    
    // Déclenche un resize event
    window.dispatchEvent(new Event('resize'));
  }
};