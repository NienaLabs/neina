import "server-only";

/**
 * Moolre payments client (https://docs.moolre.com).
 *
 * Two collection flows are supported:
 *   1. Direct mobile money charge — POST /open/transact/payment sends a USSD
 *      approval prompt to the payer's phone (MTN / Telecel / AT). We then poll
 *      POST /open/transact/status until the payer approves or the request expires.
 *   2. Hosted checkout — POST /embed/link returns a Moolre Web POS page URL
 *      (cards, other networks). Moolre redirects back to us and fires the webhook.
 *
 * Environments:
 *   - live:    https://api.moolre.com     (X-API-USER + X-API-KEY / X-API-PUBKEY)
 *   - sandbox: https://sandbox.moolre.com (only X-API-USER is required)
 *
 * Required env vars:
 *   MOOLRE_API_USER        — Moolre username
 *   MOOLRE_ACCOUNT_NUMBER  — Moolre wallet/account number (e.g. 10000015XXXX)
 *   MOOLRE_API_KEY         — Private API key  (live only)
 *   MOOLRE_API_PUBKEY      — Public API key   (live only)
 *   MOOLRE_ENV             — "live" | "sandbox" (defaults to sandbox outside production)
 */

const MOOLRE_ENV =
  process.env.MOOLRE_ENV ??
  (process.env.NODE_ENV === "production" ? "live" : "sandbox");

export const MOOLRE_BASE_URL =
  MOOLRE_ENV === "live" ? "https://api.moolre.com" : "https://sandbox.moolre.com";

const API_USER = process.env.MOOLRE_API_USER;
const API_KEY = process.env.MOOLRE_API_KEY;
const API_PUBKEY = process.env.MOOLRE_API_PUBKEY;

export const MOOLRE_ACCOUNT_NUMBER = process.env.MOOLRE_ACCOUNT_NUMBER ?? "";

if (!API_USER) {
  console.warn("[Moolre] MOOLRE_API_USER is not defined in environment variables");
}

/** Standard Moolre response envelope. `status` is 1 on success, 0 on failure. */
export interface MoolreResponse<T = unknown> {
  status: number | string;
  code: string;
  message: string | string[] | null;
  data: T;
  go?: unknown;
}

/**
 * Mobile money channels for collections (Initiate Payment):
 * 13 = MTN, 6 = Telecel, 7 = AT (AirtelTigo)
 */
export const MOMO_CHANNELS = {
  MTN: "13",
  TELECEL: "6",
  AT: "7",
} as const;

export type MomoNetwork = keyof typeof MOMO_CHANNELS;

/** Moolre response code meaning an SMS OTP must be completed before charging. */
export const MOOLRE_CODE_OTP_REQUIRED = "TP14";
/** Moolre response code for a successfully dispatched payment request. */
export const MOOLRE_CODE_PAYMENT_SENT = "TR099";

/** Transaction status values returned by the status endpoint. */
export const TXSTATUS = {
  PENDING: 0,
  SUCCESS: 1,
  FAILED: 2,
} as const;

function headers(kind: "private" | "public"): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-USER": API_USER ?? "",
  };
  // Sandbox only needs X-API-USER
  if (MOOLRE_ENV === "live") {
    if (kind === "private" && API_KEY) h["X-API-KEY"] = API_KEY;
    if (kind === "public" && API_PUBKEY) h["X-API-PUBKEY"] = API_PUBKEY;
  }
  return h;
}

async function post<T>(
  path: string,
  body: Record<string, unknown>,
  auth: "private" | "public"
): Promise<MoolreResponse<T>> {
  const res = await fetch(`${MOOLRE_BASE_URL}${path}`, {
    method: "POST",
    headers: headers(auth),
    body: JSON.stringify(body),
  });

  let json: MoolreResponse<T>;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Moolre returned a non-JSON response (HTTP ${res.status})`);
  }

  if (!res.ok && !json.code) {
    throw new Error(`Moolre request failed (HTTP ${res.status})`);
  }
  return json;
}

function firstMessage(message: string | string[] | null): string | undefined {
  return Array.isArray(message) ? message[0] : message ?? undefined;
}

// ---------------------------------------------------------------------------
// Collections — direct mobile money charge
// ---------------------------------------------------------------------------

export interface InitiatePaymentParams {
  /** Payer's mobile money number, e.g. 0244123456 */
  payer: string;
  network: MomoNetwork;
  /** Amount in GHS (major unit), e.g. 450 or 12.5 */
  amount: number;
  /** Our unique transaction reference */
  externalref: string;
  /** OTP code — only on retry after an OTP_REQUIRED response */
  otpcode?: string;
  /** Optional human-readable narration shown to the payer */
  reference?: string;
}

export type InitiatePaymentResult =
  | { kind: "sent"; moolreRef: string }
  | { kind: "otp_required"; message: string }
  | { kind: "error"; code: string; message: string };

/**
 * Sends a USSD payment approval prompt to the payer's phone.
 * The charge is NOT complete when this resolves — poll getPaymentStatus
 * (or wait for the webhook) until txstatus becomes SUCCESS/FAILED.
 */
export async function initiatePayment(
  params: InitiatePaymentParams
): Promise<InitiatePaymentResult> {
  const res = await post<string | null>(
    "/open/transact/payment",
    {
      type: 1,
      channel: MOMO_CHANNELS[params.network],
      currency: "GHS",
      payer: params.payer,
      amount: params.amount.toFixed(2),
      externalref: params.externalref,
      reference: params.reference,
      ...(params.otpcode ? { otpcode: params.otpcode } : {}),
      accountnumber: MOOLRE_ACCOUNT_NUMBER,
    },
    "private"
  );

  if (res.code === MOOLRE_CODE_OTP_REQUIRED) {
    return {
      kind: "otp_required",
      message:
        firstMessage(res.message) ??
        "Enter the verification code sent to your phone via SMS.",
    };
  }

  if (Number(res.status) === 1) {
    return { kind: "sent", moolreRef: typeof res.data === "string" ? res.data : "" };
  }

  return {
    kind: "error",
    code: res.code,
    message: firstMessage(res.message) ?? "Failed to initiate payment",
  };
}

// ---------------------------------------------------------------------------
// Collections — hosted payment link (cards, all networks)
// ---------------------------------------------------------------------------

export interface GeneratePaymentLinkParams {
  /** Amount in GHS (major unit) */
  amount: number;
  /** Payer email shown on the Web POS page */
  email: string;
  externalref: string;
  /** URL Moolre redirects the payer to after successful payment */
  redirect: string;
  /** Server webhook URL for payment notifications */
  callback?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentLinkData {
  authorization_url: string;
  reference: string;
}

/** Creates a single-use hosted Moolre Web POS checkout page. */
export async function generatePaymentLink(
  params: GeneratePaymentLinkParams
): Promise<PaymentLinkData> {
  const res = await post<PaymentLinkData>(
    "/embed/link",
    {
      type: 1,
      amount: params.amount.toFixed(2),
      email: params.email,
      externalref: params.externalref,
      redirect: params.redirect,
      ...(params.callback ? { callback: params.callback } : {}),
      reusable: "0",
      expiration_time: 60,
      currency: "GHS",
      accountnumber: MOOLRE_ACCOUNT_NUMBER,
      ...(params.metadata ? { metadata: params.metadata } : {}),
    },
    "public"
  );

  if (Number(res.status) !== 1 || !res.data?.authorization_url) {
    throw new Error(firstMessage(res.message) ?? "Failed to generate payment link");
  }
  return res.data;
}

// ---------------------------------------------------------------------------
// Status verification
// ---------------------------------------------------------------------------

export interface PaymentStatusData {
  txstatus: number;
  txtype: number;
  accountnumber: string;
  payer: string;
  payee: string;
  amount: string;
  value: string;
  transactionid: string;
  externalref: string;
  thirdpartyref: string;
  ts: string;
}

export type PaymentStatusResult =
  | { kind: "success"; data: PaymentStatusData }
  | { kind: "pending" }
  | { kind: "failed"; message: string };

/**
 * Checks the status of a payment by OUR externalref (idtype 1).
 * This is the source of truth — webhook payloads are re-verified through here.
 */
export async function getPaymentStatus(
  externalref: string
): Promise<PaymentStatusResult> {
  const res = await post<PaymentStatusData | null>(
    "/open/transact/status",
    {
      type: 1,
      idtype: "1",
      id: externalref,
      accountnumber: MOOLRE_ACCOUNT_NUMBER,
    },
    "public"
  );

  const tx = res.data;
  if (Number(res.status) === 1 && tx && Number(tx.txstatus) === TXSTATUS.SUCCESS) {
    return { kind: "success", data: tx };
  }
  if (tx && Number(tx.txstatus) === TXSTATUS.FAILED) {
    return { kind: "failed", message: firstMessage(res.message) ?? "Payment failed" };
  }
  return { kind: "pending" };
}
