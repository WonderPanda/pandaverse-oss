/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ApolloCacheEntityId,
  ModifyApolloCacheArgs,
  TypeSafePolicies,
  OnlyStringKeys,
} from './types';
import isObject from 'lodash/isObject';
import { ApolloCache, NormalizedCacheObject, Reference } from '@apollo/client';
import { Modifiers } from '@apollo/client/cache/core/types/common';

/**
 * Creates various type safe utility functions based on provided type safe policies derived from the GraphQL API Query Root
 * @param typeSafePolicies
 * @returns
 */
const makeApolloUtils = <TQueryRoot extends Record<string, unknown>>(
  typeSafePolicies: TypeSafePolicies<TQueryRoot>
) => {
  const validateEntityId = <TKey extends OnlyStringKeys<TQueryRoot>>(
    cache: ApolloCache<NormalizedCacheObject>,
    entityId: ApolloCacheEntityId<TQueryRoot, TKey>
  ) => {
    const { key, typeName } = entityId;
    const keyParts = isObject(key) ? key : { id: key };

    const expectedKeyFields = (typeSafePolicies[typeName]?.keyFields ?? [
      'id',
    ]) as unknown as string[];

    const hasRequiredKeyFields = expectedKeyFields.every(
      (key) => key in keyParts
    );
    if (!hasRequiredKeyFields) {
      throw new Error(
        `Incorrect keyFields specified for '${typeName}'. Expected '${expectedKeyFields}' but got '${Object.keys(
          keyParts
        )}'`
      );
    }

    const cacheId = cache.identify({
      __typename: typeName,
      ...keyParts,
    });

    if (!cacheId) {
      throw new Error(`Could not identify cacheId for '${typeName}'`);
    }

    return cacheId;
  };

  const clearEntity = <TKey extends OnlyStringKeys<TQueryRoot>>(
    cache: ApolloCache<NormalizedCacheObject>,
    entityId: ApolloCacheEntityId<TQueryRoot, TKey>
  ) => {
    const cacheId = validateEntityId(cache, entityId);
    return cache.evict({ id: cacheId });
  };

  const modifyCache = <TKey extends OnlyStringKeys<TQueryRoot>>(
    cache: ApolloCache<NormalizedCacheObject>,
    args: ModifyApolloCacheArgs<TQueryRoot, TKey>
  ) => {
    const { modify, ...rest } = args;

    const cacheId = validateEntityId(cache, rest);

    return cache.modify({
      id: cacheId,
      fields: modify as unknown as Modifiers,
    });
  };

  const getRefFromEntityId = <TKey extends OnlyStringKeys<TQueryRoot>>(
    cache: ApolloCache<NormalizedCacheObject>,
    entityId: ApolloCacheEntityId<TQueryRoot, TKey>
  ): Reference => {
    const id = validateEntityId(cache, entityId);
    return { __ref: id };
  };

  return {
    /**
     * Validates the cache id for a supplied entity by ensuring that all the keys specificed in
     * the type policies are provided when trying to access to the entity
     */
    validateEntityId,
    /**
     * Returns a ref object for a supplied entity id
     */
    getRefFromEntityId,
    /**
     * Type safe cache modification
     */
    modifyCache,
    /**
     * Clear a specific entity from the cache
     */
    clearEntity,
  };
};
