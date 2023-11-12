import { AppInfo, TypeInput } from 'supertokens-node/types';

export type SuperTokensModuleConfig = {
  appInfo: AppInfo;
  connectionURI: string;
  apiKey?: string;
  recipeList: TypeInput['recipeList'];
};
