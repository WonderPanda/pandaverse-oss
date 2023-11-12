import { Injectable, NestMiddleware } from '@nestjs/common';
import { middleware } from 'supertokens-node/framework/express';

@Injectable()
export class SupertokensMiddleware implements NestMiddleware {
  private readonly supertokensMiddleware = middleware();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  use(req: any, res: any, next: (error?: any) => void): any {
    return this.supertokensMiddleware(req, res, next);
  }
}
