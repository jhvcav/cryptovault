// src/config/authorizedWallets.ts
export interface AuthorizedWallet {
  address: string;
  firstName: string;
  lastName: string;
  status: 'Active' | 'Suspended' | 'Inactive';
  registrationDate: string;
}

export const authorizedWallets: AuthorizedWallet[] = [
  {
    address: "0xec0cf7505c86e0ea33a2f2de4660e6a06abe92dd",
    firstName: "Votre",
    lastName: "Nom",
    status: "Active",
    registrationDate: "2025-01-09"
  },
  // Ajoutez d'autres adresses ici facilement
  // {
  //   address: "0x742d35cc6634c0532925a3b8d404debc12345678",
  //   firstName: "Autre",
  //   lastName: "Utilisateur", 
  //   status: "Active",
  //   registrationDate: "2025-01-09"
  // }
];

// Fonction utilitaire pour ajouter une nouvelle adresse
export const addAuthorizedWallet = (wallet: Omit<AuthorizedWallet, 'registrationDate'>) => {
  authorizedWallets.push({
    ...wallet,
    registrationDate: new Date().toISOString().split('T')[0]
  });
};