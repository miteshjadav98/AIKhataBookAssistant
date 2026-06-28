import { Prisma } from '@prisma/client';

export type DecimalLike = Prisma.Decimal | number | null | undefined;

/**
 * Convert a Prisma Decimal (or number/null) into a plain JS number for in-memory
 * calculations and comparisons. Money is stored as Postgres `numeric` (exact), but
 * JS arithmetic still needs primitives.
 */
export function toNum(value: DecimalLike): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : value.toNumber();
}

/**
 * Round a monetary amount to 2 decimal places. Use this on any value computed in JS
 * before persisting it, so binary-float artifacts (e.g. 0.1 + 0.2) never reach the DB.
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
