const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
  console.warn("[Paystack] PAYSTACK_SECRET_KEY is not defined in environment variables");
}

/** Base response wrapper from Paystack API */
interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface InitializeTransactionResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface VerifyTransactionData {
  id: number;
  status: string;
  reference: string;
  amount: number;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  ip_address: string;
  metadata: any;
  log: any;
  authorization: {
    authorization_code: string;
    card_type: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    reusable: boolean;
    bank: string;
  };
  customer: {
    id: number;
    email: string;
    customer_code: string;
    phone: string | null;
    metadata: any;
    risk_action: string;
  };
  subscription_code?: string;
}

export interface VerifyTransactionResponse {
  status: boolean;
  message: string;
  data: VerifyTransactionData;
}

export interface PaystackSubscription {
  id: number;
  subscription_code: string;
  email_token: string;
  status: string;
  plan: {
    id: number;
    plan_code: string;
    name: string;
    interval: string;
    amount: number;
  };
  authorization: {
    authorization_code: string;
  };
  next_payment_date: string;
  createdAt: string;
}

/**
 * Initializes a Paystack transaction.
 * For SUBSCRIPTION payments, pass a planCode to link the transaction
 * to a Paystack Plan — this auto-creates a recurring subscription after
 * the first successful charge.
 *
 * @param email - Customer email
 * @param amount - Amount in smallest currency unit (kobo for NGN, pesewas for GHS)
 * @param callbackUrl - URL Paystack redirects to after payment
 * @param metadata - Custom key-value data attached to the transaction
 * @param planCode - Optional Paystack Plan code (PLN_xxx) for recurring subscriptions
 */
export const initializeTransaction = async (
  email: string,
  amount: number,
  callbackUrl?: string,
  metadata?: any,
  planCode?: string
): Promise<InitializeTransactionResponse> => {
  try {
    const body: Record<string, any> = {
      email,
      amount,
      callback_url: callbackUrl,
      metadata,
    };

    // Attaching a plan_code turns a regular charge into a subscription
    if (planCode) {
      body.plan = planCode;
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to initialize transaction");
    }

    const result: PaystackResponse<InitializeTransactionResponse> = await response.json();
    return result.data;
  } catch (error: any) {
    console.error("[Paystack] initializeTransaction error:", error.message);
    throw new Error(error.message || "Failed to initialize transaction");
  }
};

/**
 * Verifies a Paystack transaction by its reference string.
 * Returns the full transaction data including subscription_code if applicable.
 */
export const verifyTransaction = async (reference: string): Promise<VerifyTransactionResponse> => {
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to verify transaction");
    }

    return await response.json();
  } catch (error: any) {
    console.error("[Paystack] verifyTransaction error:", error.message);
    throw new Error(error.message || "Failed to verify transaction");
  }
};

/**
 * Disables (cancels) a Paystack subscription.
 * Requires both the subscription code and the email token provided by Paystack.
 *
 * @param subscriptionCode - e.g. "SUB_xxxxxxxxxxxx"
 * @param emailToken - The email_token from the subscription object
 */
export const cancelPaystackSubscription = async (
  subscriptionCode: string,
  emailToken: string
): Promise<void> => {
  try {
    const response = await fetch("https://api.paystack.co/subscription/disable", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: subscriptionCode,
        token: emailToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to cancel subscription");
    }
  } catch (error: any) {
    console.error("[Paystack] cancelPaystackSubscription error:", error.message);
    throw new Error(error.message || "Failed to cancel subscription");
  }
};

/**
 * Fetches all subscriptions for a customer by their email address.
 * Used to find the active subscription code when cancelling.
 *
 * @param customerEmail - Customer email to look up subscriptions for
 */
export const listCustomerSubscriptions = async (
  customerEmail: string
): Promise<PaystackSubscription[]> => {
  try {
    const url = new URL("https://api.paystack.co/subscription");
    url.searchParams.set("customer", customerEmail);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to list subscriptions");
    }

    const result: PaystackResponse<PaystackSubscription[]> = await response.json();
    return result.data ?? [];
  } catch (error: any) {
    console.error("[Paystack] listCustomerSubscriptions error:", error.message);
    throw new Error(error.message || "Failed to list subscriptions");
  }
};

/**
 * Fetches a single subscription by its subscription code.
 * Used to get the email_token needed for cancellation.
 *
 * @param subscriptionCode - e.g. "SUB_xxxxxxxxxxxx"
 */
export const getSubscription = async (
  subscriptionCode: string
): Promise<PaystackSubscription> => {
  try {
    const response = await fetch(
      `https://api.paystack.co/subscription/${subscriptionCode}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch subscription");
    }

    const result: PaystackResponse<PaystackSubscription> = await response.json();
    return result.data;
  } catch (error: any) {
    console.error("[Paystack] getSubscription error:", error.message);
    throw new Error(error.message || "Failed to fetch subscription");
  }
};
