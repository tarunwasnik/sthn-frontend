export interface AdminFxSnapshotDto {
  snapshotReference: string;
  provider: string;
  baseCurrency: string;
  quoteCurrency: string;
  rate: string;
  inverseRate: string;
  effectiveDate: string;
  providerPublishedAt?: string;
  fetchedAt: string;
  validFrom: string;
  expiresAt: string;
  isCurrent: boolean;
  isStale: boolean;
  cached: boolean;
  cachedFallback: boolean;
  baseMinorUnits: number;
  quoteMinorUnits: number;
}

export interface AdminFxReadDto {
  provider: string;
  providerMode: "INTERNAL" | "REFERENCE";
  refreshPairs: Array<{ baseCurrency: string; quoteCurrency: string }>;
  snapshots: AdminFxSnapshotDto[];
}

export interface DataResponse<T> { success: boolean; data: T; }
