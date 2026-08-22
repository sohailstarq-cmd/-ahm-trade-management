export function computeOverallPaymentStatus(payments: { received: boolean; amount: number }[]): string {
  if (payments.length === 0) return "PENDING";
  const allReceived = payments.every((p) => p.received);
  const anyReceived = payments.some((p) => p.received);
  if (allReceived) return "PAID";
  if (anyReceived) return "PARTIALLY_PAID";
  return "PENDING";
}
Add computeOverallPaymentStatus helper
