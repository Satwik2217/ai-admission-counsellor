import Razorpay from "razorpay";

let instance: Razorpay | null = null;

function getInstance(): Razorpay | null {
  if (instance) return instance;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return instance;
}

export function isRazorpayConfigured(): boolean {
  return !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET;
}

export async function createCustomer(params: {
  name: string;
  email: string;
  phone?: string;
}): Promise<string | null> {
  const rp = getInstance();
  if (!rp) return null;
  const customer = await rp.customers.create({
    name: params.name,
    email: params.email,
    contact: params.phone ? `+91${params.phone.replace(/\D/g, "")}` : undefined,
  });
  return customer.id;
}

export async function createSubscription(params: {
  planId: string;
  totalCount: number;
  notes?: Record<string, string>;
}): Promise<{ id: string; shortUrl: string } | null> {
  const rp = getInstance();
  if (!rp) return null;
  const input: Record<string, unknown> = {
    plan_id: params.planId,
    total_count: params.totalCount,
    customer_notify: 1,
  };
  if (params.notes) input.notes = params.notes;
  const subscription = await rp.subscriptions.create(input as never);
  return { id: subscription.id, shortUrl: subscription.short_url };
}

export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  const rp = getInstance();
  if (!rp) return false;
  await rp.subscriptions.cancel(subscriptionId);
  return true;
}

export async function fetchSubscription(subscriptionId: string) {
  const rp = getInstance();
  if (!rp) return null;
  return rp.subscriptions.fetch(subscriptionId);
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET || "";
  if (!secret) return false;
  return Razorpay.validateWebhookSignature(
    `${orderId}|${paymentId}`,
    signature,
    secret
  );
}

export function verifySubscriptionSignature(params: {
  paymentId: string;
  subscriptionId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET || "";
  if (!secret) return false;
  return Razorpay.validateWebhookSignature(
    `${params.paymentId}|${params.subscriptionId}`,
    params.signature,
    secret
  );
}
