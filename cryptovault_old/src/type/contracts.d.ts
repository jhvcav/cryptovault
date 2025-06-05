export interface Stake {
    planId: number;
    amount: bigint;
    startTime: number;
    endTime: number;
    lastRewardTime: number;
    active: boolean;
  }
  
  export interface Position {
    farmId: number;
    amount: bigint;
    startTime: number;
    endTime: number;
    lastRewardTime: number;
    active: boolean;
  }
  
  declare global {
    interface Window {
      ethereum?: {
        request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
        on: (event: string, callback: (accounts: string[]) => void) => void;
        removeListener: (event: string, callback: (accounts: string[]) => void) => void;
      };
    }
  }