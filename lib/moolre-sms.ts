import "server-only";

import { MOOLRE_BASE_URL, MoolreResponse } from "@/lib/moolre";

/**
 * Moolre SMS client (docs.moolre.com → SMS API).
 *
 * POST /open/sms/send authenticates with the VAS key (X-API-VASKEY) — a
 * separate credential from the payment API keys, generated on app.moolre.com
 * under the SMS service. The sender ID must be registered and approved on the
 * dashboard before messages are delivered.
 *
 * Required env vars:
 *   MOOLRE_API_VASKEY     — VAS key for SMS/USSD value-added services
 *   MOOLRE_SMS_SENDER_ID  — approved sender ID (max 11 chars, default "Niena")
 *
 * SMS is a best-effort side channel (receipts, notifications) — callers should
 * never let a send failure break the main flow, so sendSms returns false
 * instead of throwing.
 */

const VASKEY = process.env.MOOLRE_API_VASKEY;
const SENDER_ID = process.env.MOOLRE_SMS_SENDER_ID ?? "Niena";

/** True when SMS is configured for this deployment. */
export function smsEnabled(): boolean {
  return Boolean(VASKEY);
}

export interface SmsMessage {
  /** Recipient phone number in local Ghana format, e.g. 0244123456 */
  recipient: string;
  message: string;
  /** Optional reference for delivery tracking */
  ref?: string;
}

/**
 * Sends one or more SMS messages. Returns true if Moolre accepted the batch.
 * Never throws — failures are logged and reported as false.
 */
export async function sendSms(messages: SmsMessage | SmsMessage[]): Promise<boolean> {
  if (!VASKEY) {
    console.warn("[Moolre SMS] MOOLRE_API_VASKEY not set — skipping send");
    return false;
  }

  const batch = Array.isArray(messages) ? messages : [messages];

  try {
    const res = await fetch(`${MOOLRE_BASE_URL}/open/sms/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-VASKEY": VASKEY,
      },
      body: JSON.stringify({
        type: 1,
        senderid: SENDER_ID,
        messages: batch,
      }),
    });

    const json = (await res.json()) as MoolreResponse;
    if (Number(json.status) === 1) return true;

    console.error(
      `[Moolre SMS] Send failed (${json.code}): ${
        Array.isArray(json.message) ? json.message[0] : json.message
      }`
    );
    return false;
  } catch (err) {
    console.error("[Moolre SMS] Send error:", err);
    return false;
  }
}
