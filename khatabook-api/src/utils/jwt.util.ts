/**
 * Returns the JWT signing secret from the environment.
 *
 * Fails fast (at the first call) if JWT_SECRET is not configured, instead of
 * silently falling back to a hardcoded, publicly-known secret — which would
 * let anyone forge admin/customer tokens.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error(
      'JWT_SECRET environment variable is not set. Refusing to sign/verify tokens with an insecure default.',
    );
  }
  return secret;
}
