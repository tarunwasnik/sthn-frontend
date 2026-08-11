//frontend/src/api/adminWallet.api.ts

import api from "./axios";

export const getWalletBackfillPreview = async () => {
  const response = await api.get("/v1/admin/wallets/backfill/preview");
  return response.data;
};

export const runWalletBackfill = async () => {
  const response = await api.post("/v1/admin/wallets/backfill");
  return response.data;
};
