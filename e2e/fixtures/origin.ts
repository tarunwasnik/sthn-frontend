export const e2eOrigin = process.env.STHN_E2E_ORIGIN;
if (!e2eOrigin) throw new Error("STHN_E2E_ORIGIN is required from Playwright global setup");
