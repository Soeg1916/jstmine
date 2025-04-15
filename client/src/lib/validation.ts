/**
 * Validates a recovery code format.
 * Expected format: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
 * where X is an alphanumeric character
 */
export function validateRecoveryCode(code: string): boolean {
  if (!code) return false;
  const regex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return regex.test(code);
}

/**
 * Validates a Bitcoin address format.
 * Basic validation: Bitcoin addresses typically start with 1, 3, or bc1
 */
export function validateBitcoinAddress(address: string): boolean {
  if (!address) return false;
  const regex = /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/;
  return regex.test(address);
}
