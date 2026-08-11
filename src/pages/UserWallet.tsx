// frontend/src/pages/UserWallet.tsx
//
// User dashboard Wallet page — real backend Wallet authority.
// Consumes the shared User-owned Wallet domain (useWallets).

import UserDashboardLayout from "../layouts/UserDashboardLayout";
import WalletView from "../components/wallet/WalletView";
import { useWallets } from "../features/wallet/useWallets";

export default function UserWallet() {
  const wallet = useWallets();
  return (
    <UserDashboardLayout>
      {/* WalletView renders the shared TopUpPanel (same User-owned wallet). */}
      <WalletView
        badge="User Wallet"
        subtitle="Balances across all your wallets"
        wallet={wallet}
      />
    </UserDashboardLayout>
  );
}
