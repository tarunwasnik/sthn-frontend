import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { createEvidence, markProviderOutcome, markSubmissionStarted, markUnknown, writeEvidence } from "./phase7o-evidence.mjs";

const frontendOrigin = process.env.STHN_PHASE7O_FRONTEND_ORIGIN!;
const apiOrigin = process.env.STHN_PHASE7O_API_ORIGIN!;
const customerEmail = process.env.STHN_PHASE7O_CUSTOMER_EMAIL!;
const customerPassword = process.env.STHN_PHASE7O_CUSTOMER_PASSWORD!;
const creatorEmail = process.env.STHN_PHASE7O_CREATOR_EMAIL!;
const creatorPassword = process.env.STHN_PHASE7O_CREATOR_PASSWORD!;
const evidencePath = process.env.STHN_PHASE7O_EVIDENCE_PATH!;

const checkoutPath = (url: string) => {
  try { const parsed = new URL(url); return { host: parsed.hostname, path: parsed.pathname }; }
  catch { return { host: "invalid", path: "invalid" }; }
};
const persistDiagnostic = (testInfo: { outputPath: (name: string) => string }, name: string, value: unknown) =>
  writeFile(testInfo.outputPath(name), `${JSON.stringify(value, null, 2)}\n`, "utf8");

test("loads the isolated creator profile and authenticates the synthetic customer", async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  const apiProfile = await page.request.get(`${apiOrigin}/api/public/creators/phase7o-creator`);
  expect(apiProfile.ok()).toBeTruthy();
  expect((await apiProfile.json()).slug).toBe("phase7o-creator");

  const profileResponse = page.waitForResponse((response) =>
    response.url() === `${apiOrigin}/api/public/creators/phase7o-creator` && response.request().method() === "GET",
    { timeout: 15_000 },
  );
  await page.goto(`${frontendOrigin}/creators/phase7o-creator`, { waitUntil: "domcontentloaded", timeout: 15_000 });
  expect((await profileResponse).ok()).toBeTruthy();
  await expect(page.getByText("Phase 7O Creator")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("isolated-creator-profile.png"), fullPage: true });

  await page.goto(`${frontendOrigin}/login`, { waitUntil: "domcontentloaded", timeout: 15_000 });
  await page.locator('input[type="email"]').fill(customerEmail);
  await page.locator('input[type="password"]').fill(customerPassword);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/dashboard\/user/, { timeout: 15_000 });

  await testInfo.attach("browser-console-errors.json", {
    body: Buffer.from(JSON.stringify(consoleErrors, null, 2)),
    contentType: "application/json",
  });
});

test("opens an isolated Razorpay checkout and preserves pre-submission evidence", async ({ page }, testInfo) => {
  test.skip(process.env.STHN_PHASE7O_PAYMENT_SUBMISSION_APPROVED === "true", "The approved capture test performs its own admission and readiness checks.");
  test.setTimeout(60_000);
  await page.goto(`${frontendOrigin}/login`, { waitUntil: "domcontentloaded", timeout: 15_000 });
  await page.locator('input[type="email"]').fill(customerEmail);
  await page.locator('input[type="password"]').fill(customerPassword);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/dashboard\/user/, { timeout: 15_000 });
  await page.goto(`${frontendOrigin}/creators/phase7o-creator`, { waitUntil: "domcontentloaded", timeout: 15_000 });
  await page.getByText("Phase 7O Test Service", { exact: true }).first().click();
  await page.locator('input[type="date"]').fill(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const slot = page.locator("div.grid.grid-cols-2 button").first();
  await expect(slot).toBeVisible({ timeout: 15_000 }); await slot.click();
  await expect(page.getByText("Booking payment review")).toBeVisible({ timeout: 15_000 });
  await page.getByText("Razorpay test checkout", { exact: true }).click();
  const admission = page.waitForResponse((response) => response.url() === `${apiOrigin}/api/v1/bookings/request` && response.request().method() === "POST", { timeout: 20_000 });
  await page.getByRole("button", { name: "Continue to Razorpay test checkout" }).click();
  const admissionResponse = await admission; expect(admissionResponse.ok()).toBeTruthy();
  const admitted = await admissionResponse.json(); const bookingId = String(admitted.booking?._id ?? ""); const paymentId = String(admitted.payment?._id ?? "");
  expect(bookingId).not.toBe(""); expect(paymentId).not.toBe("");
  const reconciliation = await page.request.get(`${apiOrigin}/phase7o/reconciliation/${bookingId}`); expect(reconciliation.ok()).toBeTruthy();
  const local = await reconciliation.json();
  await writeEvidence(evidencePath, createEvidence({ runId: `phase7o-readiness-${testInfo.testId}`, bookingId, paymentId, operationId: local.operationId, razorpayOrderId: local.razorpayOrderId, expectedAmount: local.expectedAmount, expectedCurrency: local.expectedCurrency }));
  const checkout = page.frameLocator("iframe.razorpay-checkout-frame, iframe[src*='razorpay']");
  await expect(checkout.getByPlaceholder("Mobile number")).toBeVisible({ timeout: 15_000 });
  await checkout.getByPlaceholder("Mobile number").fill("9000012345");
  try {
    await checkout.getByTestId("contact-overlay-container").getByRole("button", { name: "Continue" }).click({ timeout: 10_000 });
  } catch {
    // Razorpay can detach the contact overlay as it transitions into the card form.
  }
  await expect(checkout.getByPlaceholder("Card Number")).toBeVisible({ timeout: 15_000 });
  const cardNumber = checkout.getByPlaceholder("Card Number");
  const expiry = checkout.getByPlaceholder("MM / YY");
  // Deliberately inspect normal focus navigation with empty fields only. This does not
  // enter payment data or activate the provider payment control.
  await cardNumber.focus();
  const cardNumberReceivedFocus = await cardNumber.evaluate((element) => document.activeElement === element);
  await cardNumber.press("Tab");
  const expiryReceivedTabFocus = await expiry.evaluate((element) => document.activeElement === element);
  const cardNumberValidation = checkout.getByText(/Please enter a valid card number/i);
  await expect(cardNumberValidation).toBeVisible();
  const finalContinue = checkout.getByRole("button", { name: "Continue" });
  await expect(finalContinue).toBeVisible();
  await persistDiagnostic(testInfo, "razorpay-checkout-readiness.json", {
    razorpayFrameCount: page.frames().filter((frame) => frame.url().includes("razorpay")).length,
    mobileContactVisible: await checkout.getByPlaceholder("Mobile number").isVisible().catch(() => false),
    cardFormVisible: await checkout.getByPlaceholder("Card Number").isVisible(),
    cardNumberReceivedFocus,
    expiryReceivedTabFocus,
    cardNumberValidationVisible: await cardNumberValidation.isVisible(),
    finalContinueVisible: await finalContinue.isVisible(),
    finalContinueEnabledBeforeCardData: await finalContinue.isEnabled(),
  });
  await page.screenshot({ path: testInfo.outputPath("razorpay-card-form-ready.png"), fullPage: true });
});

test("captures one isolated Razorpay Test Mode payment and accepts its booking", async ({ page }, testInfo) => {
  test.skip(process.env.STHN_PHASE7O_PAYMENT_SUBMISSION_APPROVED !== "true", "A fresh explicit payment-submission authorization is required.");
  test.setTimeout(90_000);
  const checkoutDiagnostics: Array<{ method: string; host: string; path: string; status?: number }> = [];
  let consoleErrorCount = 0;
  page.on("console", (message) => { if (message.type() === "error") consoleErrorCount++; });
  page.on("response", (response) => {
    const target = checkoutPath(response.url());
    if (target.host.includes("razorpay") || target.path.includes("razorpay-sandbox-confirm")) {
      checkoutDiagnostics.push({ method: response.request().method(), ...target, status: response.status() });
    }
  });
  await page.goto(`${frontendOrigin}/login`, { waitUntil: "domcontentloaded", timeout: 15_000 });
  await page.locator('input[type="email"]').fill(customerEmail);
  await page.locator('input[type="password"]').fill(customerPassword);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/dashboard\/user/, { timeout: 15_000 });

  await page.goto(`${frontendOrigin}/creators/phase7o-creator`, { waitUntil: "domcontentloaded", timeout: 15_000 });
  await page.getByText("Phase 7O Test Service", { exact: true }).first().click();
  await page.locator('input[type="date"]').fill(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const slot = page.locator("div.grid.grid-cols-2 button").first();
  await expect(slot).toBeVisible({ timeout: 15_000 });
  await slot.click();

  await expect(page.getByText("Booking payment review")).toBeVisible({ timeout: 15_000 });
  await page.getByText("Razorpay test checkout", { exact: true }).click();
  const admission = page.waitForResponse((response) =>
    response.url() === `${apiOrigin}/api/v1/bookings/request` && response.request().method() === "POST",
    { timeout: 20_000 },
  );
  await page.getByRole("button", { name: "Continue to Razorpay test checkout" }).click();
  const admissionResponse = await admission;
  expect(admissionResponse.ok()).toBeTruthy();
  const admitted = await admissionResponse.json();
  const bookingId = String(admitted.booking?._id ?? "");
  const paymentId = String(admitted.payment?._id ?? "");
  expect(bookingId).not.toBe(""); expect(paymentId).not.toBe("");
  const reconciliation = await page.request.get(`${apiOrigin}/phase7o/reconciliation/${bookingId}`);
  expect(reconciliation.ok()).toBeTruthy();
  const local = await reconciliation.json();
  const evidence = createEvidence({ runId: `phase7o-${testInfo.testId}`, bookingId, paymentId, operationId: local.operationId, razorpayOrderId: local.razorpayOrderId, expectedAmount: local.expectedAmount, expectedCurrency: local.expectedCurrency });
  await writeEvidence(evidencePath, evidence);

  const checkout = page.frameLocator("iframe.razorpay-checkout-frame, iframe[src*='razorpay']");
  await checkout.getByPlaceholder("Mobile number").fill("9000012345");
  try {
    await checkout.getByTestId("contact-overlay-container").getByRole("button", { name: "Continue" }).click({ timeout: 5_000 });
  } catch {
    // Razorpay may detach the overlay during the click; the card form below is the authoritative continuation signal.
  }
  await checkout.getByPlaceholder("Card Number").waitFor({ state: "visible", timeout: 10_000 });
  await checkout.getByPlaceholder("Card Number").fill(["4100", "2800", "0000", "1007"].join(""));
  await checkout.getByPlaceholder("MM / YY").fill("12/30");
  await checkout.getByPlaceholder("CVV").fill("123");
  const finalContinue = checkout.getByRole("button", { name: "Continue" });
  await expect(finalContinue).toBeVisible();
  await expect(finalContinue).toBeEnabled();
  await persistDiagnostic(testInfo, "razorpay-pre-submit-diagnostics.json", { cardFormVisible: await checkout.getByPlaceholder("Card Number").isVisible(), finalContinueEnabled: await finalContinue.isEnabled(), razorpayFrameCount: page.frames().filter((frame) => frame.url().includes("razorpay")).length });
  const confirmation = page.waitForResponse((response) =>
    /\/api\/v1\/bookings\/[^/]+\/razorpay-sandbox-confirm$/.test(response.url()) && response.request().method() === "POST",
    { timeout: 30_000 },
  );
  await writeEvidence(evidencePath, markSubmissionStarted(evidence));
  await finalContinue.click();
  let confirmationResponse;
  try { confirmationResponse = await confirmation; }
  catch (error) {
    await persistDiagnostic(testInfo, "razorpay-post-submit-diagnostics.json", { checkoutNetwork: checkoutDiagnostics, consoleErrorCount, currentFrameUrls: page.frames().map((frame) => checkoutPath(frame.url())) });
    await writeEvidence(evidencePath, markUnknown(evidence, "Browser submit had no STHN confirmation callback.")); throw error;
  }
  expect(confirmationResponse.ok()).toBeTruthy();
  await confirmationResponse.json();
  const capturedReconciliation = await page.request.get(`${apiOrigin}/phase7o/reconciliation/${bookingId}`);
  expect(capturedReconciliation.ok()).toBeTruthy();
  const capturedLocal = await capturedReconciliation.json();
  await writeEvidence(evidencePath, markProviderOutcome(evidence, "CAPTURED", String(capturedLocal.providerPaymentId)));
  await page.waitForURL(/\/dashboard\/user\/bookings\//, { timeout: 15_000 });
  const confirmedBookingId = new URL(page.url()).pathname.split("/").at(-1)!;
  await page.screenshot({ path: testInfo.outputPath("razorpay-captured.png"), fullPage: true });

  const verification = await page.request.get(`${apiOrigin}/phase7o/financial-verification/${confirmedBookingId}`);
  expect(verification.ok()).toBeTruthy();
  const afterCapture = await verification.json();
  expect(afterCapture.booking.status).toBe("REQUESTED");
  expect(afterCapture.payment).toMatchObject({ status: "CAPTURED", provider: "RAZORPAY", currency: "INR", hasCapturedProviderPaymentId: true });
  expect(afterCapture.operation).toMatchObject({ status: "CONFIRMED", provider: "RAZORPAY", requestedCurrency: "INR", verifiedCurrency: "INR", hasCapturedProviderPaymentId: true });
  expect(afterCapture.intent).toEqual({ paymentMatchesBooking: true, operationMatchesPayment: true });
  expect(afterCapture.counts).toMatchObject({ bookings: 1, payments: 1, operations: 1, intents: 1, refunds: 0, wallets: 0, entitlements: 0, payoutAuthorizations: 0, creatorBalances: 0, withdrawalRequests: 0, withdrawals: 0, payouts: 0, fxAudits: 0 });

  await page.goto(`${frontendOrigin}/login`, { waitUntil: "domcontentloaded", timeout: 15_000 });
  await page.locator('input[type="email"]').fill(creatorEmail);
  await page.locator('input[type="password"]').fill(creatorPassword);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/dashboard\/creator/, { timeout: 15_000 });
  await page.goto(`${frontendOrigin}/dashboard/creator/requests`, { waitUntil: "domcontentloaded", timeout: 15_000 });
  await page.getByRole("button", { name: "Accept" }).click();
  await expect(page.getByText("No booking requests found.")).toBeVisible({ timeout: 15_000 });

  const acceptedVerification = await page.request.get(`${apiOrigin}/phase7o/financial-verification/${confirmedBookingId}`);
  expect(acceptedVerification.ok()).toBeTruthy();
  const afterAcceptance = await acceptedVerification.json();
  expect(afterAcceptance.booking.status).toBe("CONFIRMED");
  expect(afterAcceptance.payment.status).toBe("CAPTURED");
  expect(afterAcceptance.operation.status).toBe("CONFIRMED");
  expect(afterAcceptance.counts).toMatchObject({ bookings: 1, payments: 1, operations: 1, intents: 1, refunds: 0, wallets: 0, entitlements: 0, payoutAuthorizations: 0, creatorBalances: 0, withdrawalRequests: 0, withdrawals: 0, payouts: 0, fxAudits: 0 });
});
