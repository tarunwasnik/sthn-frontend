// frontend/src/pages/CreatorWallet.tsx
//
// Creator dashboard Wallet page — real backend Wallet authority.
// This uses the SAME shared User-owned Wallet domain (useWallets) as the
// User Wallet page. A Creator is the same underlying User identity; there
// is no separate Creator Wallet owner. Only the dashboard context differs.

import DashboardLayout from "../layouts/DashboardLayout";
import WalletView from "../components/wallet/WalletView";
import { useWallets } from "../features/wallet/useWallets";

export default function CreatorWallet() {
  const wallet = useWallets();
  return (
    <DashboardLayout>
      <WalletView
        badge="Legacy Wallet"
        subtitle="Legacy wallet balances. This is not a provider-backed Creator earnings or payout view."
        wallet={wallet}
      />
    </DashboardLayout>
  );
}
