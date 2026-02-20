import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const SECRET_FIELDS = ['passwordHash'];

function stripSecrets(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(stripSecrets);
  }
  if (obj && typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SECRET_FIELDS.includes(key)) continue;
      cleaned[key] = stripSecrets(value);
    }
    return cleaned;
  }
  return obj;
}

@Injectable()
export class StripSecretsInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => stripSecrets(data)));
  }
}
