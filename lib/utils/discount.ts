export function generateDiscountCode(prefix: string = 'KOD'): string {
  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${randomString}`;
}
