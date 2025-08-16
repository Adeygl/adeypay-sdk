// src/api.ts
export type PaymentStatus = "waiting_user_input" | "approved" | "failed" | "Paid" |string;

const DEFAULT_API = "https://deveback.adey.lol"; // local dev
let localApiBase = DEFAULT_API;
let globalApiKey: string | undefined = undefined;
let globalCallbackUrl: string | undefined = undefined;

export function setApiBase(url: string) {
  localApiBase = url;
}

export function init(options: { apiBase?: string; apiKey?: string; callbackUrl?: string }) {
  if (options.apiBase) localApiBase = options.apiBase;
  if (options.apiKey) globalApiKey = options.apiKey;
  if (options.callbackUrl) globalCallbackUrl = options.callbackUrl;
}

function ensureString(name: string, value: unknown): string {
  if (!value || typeof value !== "string") {
    throw new Error(`${name} is required and must be a non-empty string`);
  }
  return value;
}

export async function createPayment(opts: {
  amount: number;
  note?: string;
  callbackUrl?: string;
  apiKey?: string; // can be passed per-call or provided via init()
}): Promise<{ paymentId: string }> {
  const apiKey = opts.apiKey ?? globalApiKey;
  const callbackUrl = opts.callbackUrl ?? globalCallbackUrl;

  // validate amount
  if (typeof opts.amount !== "number" || isNaN(opts.amount) || opts.amount <= 0) {
    throw new Error("Missing or invalid `amount` (must be a positive number).");
  }

  // ensureString returns a string and narrows the type for TypeScript
  const apiKeyStr = ensureString("apiKey", apiKey);
  const callbackUrlStr = ensureString("callbackUrl", callbackUrl);

  const body = {
    amount: opts.amount,
    note: opts.note,
    callbackUrl: callbackUrlStr,
    apiKey: apiKeyStr,
  };

  // Build headers as Record<string,string> so no undefined values are present
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": apiKeyStr, // guaranteed to be string
  };

  const res = await fetch(`${localApiBase}/create-payment-request`, {
    method: "POST",
    headers: headers as HeadersInit,
    body: JSON.stringify(body),
  });

  // parse response safely
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errMsg = json?.error || JSON.stringify(json) || `createPayment failed (${res.status})`;
    throw new Error(errMsg);
  }
  return json as { paymentId: string };
}

export async function getPaymentStatus(paymentId: string): Promise<{ status: PaymentStatus; details?: any }> {
  if (!paymentId) throw new Error("paymentId is required for getPaymentStatus");
  const res = await fetch(`${localApiBase}/payment-status/${encodeURIComponent(paymentId)}`);
  if (!res.ok) throw new Error(`status fetch failed (${res.status})`);
  return res.json();
}
