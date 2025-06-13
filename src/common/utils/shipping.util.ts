// utils/shipping.util.ts
export function calculateShippingFee(subtotal: number): number {
  return subtotal >= 30000 ? 0 : 3000;
}
