import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Prisma } from '@prisma/client';

/**
 * Recursively converts any Prisma.Decimal values in a response payload into plain
 * JS numbers. Money is stored as Postgres `numeric` for exactness, but the frontend
 * and AI tools expect numeric JSON — without this they'd receive Decimal objects
 * (which serialize to strings). Conversion is idempotent.
 */
function convertDecimals(value: any): any {
  if (value === null || value === undefined) return value;
  if (value instanceof Prisma.Decimal) return value.toNumber();
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(convertDecimals);
  if (typeof value === 'object') {
    for (const key of Object.keys(value)) {
      value[key] = convertDecimals(value[key]);
    }
    return value;
  }
  return value;
}

@Injectable()
export class DecimalToNumberInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => convertDecimals(data)));
  }
}
