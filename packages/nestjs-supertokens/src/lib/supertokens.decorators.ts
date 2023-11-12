import { ExecutionContext, Inject, createParamDecorator } from '@nestjs/common';
import { SUPERTOKENS_MODULE_CONFIG_TOKEN } from './supertokens.module-definition';
// import { SessionContainer } from 'supertokens-node/recipe/session';

export const Session = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.session;
  }
);

// export const TenantId = createParamDecorator(
//   (_data: unknown, ctx: ExecutionContext) => {
//     const request = ctx.switchToHttp().getRequest();
//     const session = request.session as SessionContainer;
//     return SessionSchema.parse(session.getAccessTokenPayload())[
//       'https://hasura.io/jwt/claims'
//     ]['x-hasura-tenant-id'];
//   }
// );

// export const UserId = createParamDecorator(
//   (_data: unknown, ctx: ExecutionContext) => {
//     const request = ctx.switchToHttp().getRequest();
//     const session = request.session as SessionContainer;
//     return SessionSchema.parse(session.getAccessTokenPayload())[
//       'https://hasura.io/jwt/claims'
//     ]['x-hasura-user-id'];
//   }
// );

export const InjectSupertokensConfig = () =>
  Inject(SUPERTOKENS_MODULE_CONFIG_TOKEN);
