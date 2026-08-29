/**
 * Payments boundary.
 *
 * Nothing in the app talks to a payment gateway directly. Everything goes through
 * this interface, so wiring Razorpay or Cashfree in Phase 7 is one new file and a
 * config switch — not a refactor.
 *
 * IMPORTANT: WorthIt must never hold customer funds in its own account. Escrow runs
 * through a licensed partner (Castler, Escrowpay) or the payment aggregator's own
 * escrow. See the RBI (Regulation of Payment Aggregators) Directions, 2025.
 */

export interface PaymentIntent {
  ref: string;
  amountPaise: number;
  currency: "INR";
  status: "created" | "authorised" | "captured" | "failed";
  checkoutUrl?: string;
}

export interface EscrowRelease {
  ref: string;
  releasedPaise: number;
  releasedAt: Date;
}

export interface PaymentsProvider {
  readonly name: string;
  createIntent(input: {
    orderId: string;
    amountPaise: number;
    buyerId: string;
    description: string;
  }): Promise<PaymentIntent>;

  /** Move captured funds into escrow, held until the buyer accepts or the window lapses. */
  holdInEscrow(input: { paymentRef: string; orderId: string }): Promise<{ escrowRef: string }>;

  /** Release to the seller after the inspection window closes. */
  releaseEscrow(input: { escrowRef: string; sellerId: string }): Promise<EscrowRelease>;

  refund(input: { paymentRef: string; amountPaise: number; reason: string }): Promise<{ refundRef: string }>;

  verifyWebhook(rawBody: string, signature: string): boolean;
}

/**
 * Phase 1-6 stub. Every method throws loudly rather than silently succeeding —
 * a payments no-op that returns success is how you ship a marketplace that
 * takes orders and never charges anyone.
 */
export const noopPayments: PaymentsProvider = {
  name: "none",
  async createIntent() { throw new Error("Payments are not enabled yet. See docs/BUILD.md Phase 7."); },
  async holdInEscrow() { throw new Error("Escrow is not enabled yet."); },
  async releaseEscrow() { throw new Error("Escrow is not enabled yet."); },
  async refund() { throw new Error("Refunds are not enabled yet."); },
  verifyWebhook() { return false; },
};

export function getPaymentsProvider(): PaymentsProvider {
  switch (process.env.PAYMENTS_PROVIDER) {
    case "razorpay":
    case "cashfree":
      throw new Error(`PAYMENTS_PROVIDER=${process.env.PAYMENTS_PROVIDER} is configured but not implemented yet.`);
    default:
      return noopPayments;
  }
}
