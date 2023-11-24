import {
  ApolloClient,
  ApolloClientOptions,
  createHttpLink,
  InMemoryCache,
  NormalizedCacheObject,
  split,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { Observable } from 'apollo-link';

export type ApolloClientFactoryOptions = {
  uri: string;
  desiredRole?: string;
  enableSubscriptions?: boolean;
  cacheInstance?: InMemoryCache;
  connectToDevTools?: boolean;
  getContext: () => Promise<{
    jwt: string;
    role: string;
  }>;
} & Pick<ApolloClientOptions<NormalizedCacheObject>, 'defaultOptions'>;

const defaultCache = new InMemoryCache();

const defaultApolloClientOptions: ApolloClientOptions<NormalizedCacheObject>['defaultOptions'] =
  {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
    },
  };

export const makeApolloClient: (
  options: ApolloClientFactoryOptions
) => ApolloClient<NormalizedCacheObject> = (options) => {
  const {
    uri,
    cacheInstance = defaultCache,
    defaultOptions = defaultApolloClientOptions,
    enableSubscriptions = true,
    desiredRole,
    connectToDevTools = false,
    getContext,
  } = options;

  let jwt: string | undefined;
  let role: string | undefined;

  const refreshToken = async () => {
    const context = await getContext();

    jwt = context.jwt;
    role = context.role;
  };

  const authLink = setContext(async (_request, { headers }) => {
    if (!jwt) {
      await refreshToken();
    }

    const roleOverride = headers?.['x-hasura-role'];

    const newHeaders = {
      ...headers,
      Authorization: `Bearer ${jwt}`,
      'x-hasura-role': roleOverride
        ? roleOverride
        : desiredRole
        ? desiredRole
        : role,
    };

    return {
      headers: newHeaders,
    };
  });

  /**
   * If the request fails due to a JWTExpired error from Hasura, we will attempt to refresh the token
   * and then re-try the request one time
   */
  const retryErrorLink = onError(({ graphQLErrors, operation, forward }) => {
    if (
      graphQLErrors &&
      graphQLErrors.some((e) => e.message.includes('JWTExpired'))
    ) {
      return new Observable((observer) => {
        refreshToken()
          .then(() => {
            operation.setContext(({ headers = {} }) => ({
              headers: {
                ...headers,
                Authorization: `Bearer ${jwt}`,
              },
            }));
          })
          .then(() => {
            const subscriber = {
              next: observer.next.bind(observer),
              error: observer.error.bind(observer),
              complete: observer.complete.bind(observer),
            };

            forward(operation).subscribe(subscriber);
          })
          .catch((error) => {
            jwt = undefined;
            role = undefined;
            observer.error(error);
          });
        // Typing this is wonky but this is the recommended approach from a bunch of research into Apollo client workarounds
        // for async refresh code
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any;
    }

    return;
  });

  const authFlowLink = authLink.concat(retryErrorLink);

  const httpLink = authFlowLink.concat(
    createHttpLink({
      uri,
      fetch,
    })
  );

  let finalLink = httpLink;

  // If subscriptions are enabled we need to set up a websocket and then split control
  // over the operations so that subscriptions will be handled by the WS Link
  if (enableSubscriptions) {
    const [protocol, endpoint] = uri.split('//');
    const wsUri = protocol.startsWith('https')
      ? `wss://${endpoint}`
      : `ws://${endpoint}`;

    const wsLink = new GraphQLWsLink(
      createClient({
        url: wsUri,
        retryAttempts: 2,
        shouldRetry: () => true,
        connectionParams: async () => {
          const context = await getContext();

          return {
            headers: {
              Authorization: `Bearer ${context.jwt}`,
              'x-hasura-role': desiredRole ? desiredRole : context.role,
            },
          };
        },
      })
    );

    finalLink = split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      httpLink
    );
  }

  return new ApolloClient({
    cache: cacheInstance,
    link: finalLink,
    defaultOptions,
    connectToDevTools,
  });
};
