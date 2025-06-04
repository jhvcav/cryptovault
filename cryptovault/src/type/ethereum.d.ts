// ethereum.d.ts
interface Ethereum {
    request(args: { method: string; params?: any[] }): Promise<any>;
    on(eventName: string, listener: (...args: any[]) => void): void;
    removeListener(eventName: string, listener: (...args: any[]) => void): void;
    chainId: string;
    isMetaMask?: boolean;
    isConnected(): boolean;
    selectedAddress: string | null;
  }
  
  interface Window {
    ethereum?: Ethereum;
  }