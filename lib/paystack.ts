const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
  console.warn('PAYSTACK_SECRET_KEY is not defined in environment variables');
}

export interface InitializeTransactionResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface VerifyTransactionResponse {
  status: boolean;
  message: string;
  data: {
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
    customer: {
      id: number;
      email: string;
      customer_code: string;
      phone: string | null;
      metadata: any;
      risk_action: string;
    };
  };
}

export const initializeTransaction = async (
  email: string,
  amount: number, // in kobo/cents
  callbackUrl?: string,
  metadata?: any
): Promise<InitializeTransactionResponse> => {
  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email,
            amount,
            callback_url: callbackUrl,
            metadata,
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to initialize transaction');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Paystack initialization error:', error.message);
    throw new Error(error.message || 'Failed to initialize transaction');
  }
};

export const verifyTransaction = async (reference: string): Promise<VerifyTransactionResponse> => {
  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        }
    });

     if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to verify transaction');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Paystack verification error:', error.message);
    throw new Error(error.message || 'Failed to verify transaction');
  }
};
