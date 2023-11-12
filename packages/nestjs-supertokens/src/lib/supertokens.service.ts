import { Injectable, Logger } from '@nestjs/common';
import supertokens from 'supertokens-node';
import { SuperTokensModuleConfig } from './config.interface';
import { InjectSupertokensConfig } from './supertokens.decorators';

@Injectable()
export class SupertokensService {
  private readonly logger = new Logger(SupertokensService.name);

  constructor(
    @InjectSupertokensConfig() private readonly config: SuperTokensModuleConfig,
  ) {
    this.logger.log('Initializing Supertokens...');

    const { recipeList, appInfo } = config;

    supertokens.init({
      appInfo,
      supertokens: {
        connectionURI: config.connectionURI,
        apiKey: config.apiKey,
      },
      recipeList,
    });
  }
}
