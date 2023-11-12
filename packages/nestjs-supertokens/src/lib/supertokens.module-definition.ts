import { ConfigurableModuleBuilder } from '@nestjs/common';
import { SuperTokensModuleConfig } from './config.interface';

export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: SUPERTOKENS_MODULE_CONFIG_TOKEN,
} = new ConfigurableModuleBuilder<SuperTokensModuleConfig>()
  .setClassMethodName('forRoot')
  .build();
