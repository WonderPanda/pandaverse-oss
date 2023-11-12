import { MiddlewareConsumer, Module } from '@nestjs/common';

import { SupertokensMiddleware } from './supertokens.middleware';
import { SupertokensService } from './supertokens.service';
import { ConfigurableModuleClass } from './supertokens.module-definition';

@Module({
  providers: [SupertokensService],
  exports: [],
  controllers: [],
})
export class SuperTokensModule extends ConfigurableModuleClass {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SupertokensMiddleware).forRoutes('*');
  }
}
