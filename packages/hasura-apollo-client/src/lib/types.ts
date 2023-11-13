import { FieldFunctionOptions, Reference } from '@apollo/client';
import { Modifier } from '@apollo/client/cache/core/types/common';

export type OnlyStringKeys<T extends Record<PropertyKey, unknown>> = Exclude<
  keyof T,
  number | symbol
>;

// type CamelToPascal<T extends PropertyKey> =
//   T extends `${infer FirstChar}${infer Rest}`
//     ? `${Capitalize<FirstChar>}${Rest}`
//     : never;

// export type NormalizedQueryRoot<T = Record<string, unknown>> = {
//   [K in keyof T as CamelToPascal<K>]: T[K];
// };

// export type ValidQueryRoots<Q = keyof NormalizedQueryRoot> =
//   Q extends `${string}ByPk`
//     ? never
//     : Q extends `${string}Aggregate`
//     ? never
//     : Q;

type ModifierOptions = Parameters<Modifier<unknown>>[1];

export type MergeFunc<T> = (
  existing: Array<T> | undefined,
  incoming: Array<T>,
  options: FieldFunctionOptions<T>
) => Array<T>;
export type ReadFunc<T> = (
  existing: T | undefined,
  options: FieldFunctionOptions<T>
) => unknown;

export type PolicyFields<T> = {
  [Key in keyof T]?: T[Key] extends Array<infer R>
    ? { merge?: MergeFunc<R> | boolean; read?: ReadFunc<R> }
    : T[Key];
};

export type TypeSafePolicies<QueryRoot> = {
  [Key in keyof QueryRoot]?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keyFields?: QueryRoot[Key] extends Array<any>
      ? ReadonlyArray<keyof QueryRoot[Key][0]>
      : ReadonlyArray<keyof QueryRoot[Key]>;
    fields?: PolicyFields<
      QueryRoot[Key] extends Array<infer R> ? R : QueryRoot[Key]
    >;
  };
};

export type CacheModifyFn<T> = {
  [K in keyof T]?: T[K] extends Array<infer R>
    ? (
        existing: (R | Reference)[],
        options: ModifierOptions
      ) => Array<Partial<R> | Reference>
    : (existing: T[K], options: ModifierOptions) => Partial<T[K]>;
};

export type Unwrapped<T> = T extends Array<infer R> ? R : T;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PartialRecord<K extends keyof any, T> = {
  [P in K]?: T;
};

export type ApolloCacheEntityId<
  TQueryRoot extends Record<string, unknown>,
  TKey extends keyof TQueryRoot
> = {
  // typeName: ValidQueryRoots<TKey>;
  typeName: TKey;
  key:
    | string
    | number
    | PartialRecord<keyof Unwrapped<TQueryRoot[TKey]>, string | number>;
};

export type ModifyApolloCacheArgs<
  TQueryRoot extends Record<string, unknown>,
  TKey extends keyof TQueryRoot
> = ApolloCacheEntityId<TQueryRoot, TKey> & {
  modify: CacheModifyFn<Unwrapped<TQueryRoot[TKey]>>;
};
