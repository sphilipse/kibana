/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { PublicMethodsOf } from '@kbn/utility-types';
import { SchemaTypeError, Type, ValidationError } from '@kbn/config-schema';
import { cloneDeep, isEqual, merge, unset } from 'lodash';
import { set } from '@kbn/safer-lodash-set';
import { BehaviorSubject, combineLatest, firstValueFrom, Observable, identity } from 'rxjs';
import { distinctUntilChanged, map, shareReplay, tap } from 'rxjs';
import { Logger, LoggerFactory } from '@kbn/logging';
import { getDocLinks, DocLinks } from '@kbn/doc-links';

import { getFlattenedObject } from '@kbn/std';
import { Config, ConfigPath, Env } from '..';
import { hasConfigPathIntersection } from './config';
import { RawConfigurationProvider } from './raw';
import {
  applyDeprecations,
  ConfigDeprecationWithContext,
  ConfigDeprecationContext,
  ConfigDeprecationProvider,
  configDeprecationFactory,
  DeprecatedConfigDetails,
  ChangedDeprecatedPaths,
} from './deprecation';
import { ObjectToConfigAdapter } from './object_to_config_adapter';

/** @internal */
export type IConfigService = PublicMethodsOf<ConfigService>;

/** @internal */
export interface ConfigValidateParameters {
  /**
   * Indicates whether config deprecations should be logged during validation.
   */
  logDeprecations: boolean;
}

/** @internal */
export class ConfigService {
  private readonly log: Logger;
  private readonly deprecationLog: Logger;
  private readonly docLinks: DocLinks;

  private stripUnknownKeys = false;
  private validated = false;
  private readonly config$: Observable<Config>;
  private lastConfig?: Config;
  private readonly deprecatedConfigPaths = new BehaviorSubject<ChangedDeprecatedPaths>({
    set: [],
    unset: [],
  });

  /**
   * Whenever a config if read at a path, we mark that path as 'handled'. We can
   * then list all unhandled config paths when the startup process is completed.
   */
  private readonly handledPaths: Set<ConfigPath> = new Set();
  private readonly schemas = new Map<string, Type<unknown>>();
  private readonly deprecations = new BehaviorSubject<ConfigDeprecationWithContext[]>([]);
  private readonly dynamicPaths = new Map<string, string[]>();
  private readonly overrides$ = new BehaviorSubject<{
    additions: Record<string, unknown>;
    removals: string[];
  }>({ additions: {}, removals: [] });
  private readonly handledDeprecatedConfigs = new Map<string, DeprecatedConfigDetails[]>();

  constructor(
    private readonly rawConfigProvider: RawConfigurationProvider,
    private readonly env: Env,
    logger: LoggerFactory
  ) {
    this.log = logger.get('config');
    this.deprecationLog = logger.get('config', 'deprecation');
    this.docLinks = getDocLinks({
      kibanaBranch: env.packageInfo.branch,
      buildFlavor: env.packageInfo.buildFlavor,
    });

    this.config$ = combineLatest([
      this.rawConfigProvider.getConfig$(),
      this.deprecations,
      this.overrides$,
    ]).pipe(
      map(([rawConfig, deprecations, overrides]) => {
        const overridden = merge(rawConfig, overrides.additions);
        overrides.removals.forEach((key) => unset(overridden, key));
        const migrated = applyDeprecations(overridden, deprecations);
        this.deprecatedConfigPaths.next(migrated.changedPaths);
        return new ObjectToConfigAdapter(migrated.config);
      }),
      tap((config) => {
        this.lastConfig = config;
      }),
      shareReplay(1)
    );
  }

  /**
   * Set the global setting for stripUnknownKeys. Useful for running in Serverless-compatible way.
   * @param stripUnknownKeys Set to `true` if unknown keys (not explicitly forbidden) should be dropped without failing validation
   */
  public setGlobalStripUnknownKeys(stripUnknownKeys: boolean) {
    this.stripUnknownKeys = stripUnknownKeys;
  }

  /**
   * Set config schema for a path and performs its validation
   */
  public setSchema(path: ConfigPath, schema: Type<unknown>) {
    const namespace = pathToString(path);
    if (this.schemas.has(namespace)) {
      throw new Error(`Validation schema for [${path}] was already registered.`);
    }

    this.schemas.set(namespace, schema);
    this.markAsHandled(path);
  }

  /**
   * Register a {@link ConfigDeprecationProvider} to be used when validating and migrating the configuration
   */
  public addDeprecationProvider(path: ConfigPath, provider: ConfigDeprecationProvider) {
    const flatPath = pathToString(path);
    this.deprecations.next([
      ...this.deprecations.value,
      ...provider(configDeprecationFactory).map((deprecation) => ({
        deprecation,
        path: flatPath,
        context: this.createDeprecationContext(),
      })),
    ]);
  }

  /**
   * returns all handled deprecated configs
   */
  public getHandledDeprecatedConfigs() {
    return [...this.handledDeprecatedConfigs.entries()];
  }

  /**
   * Validate the whole configuration and log the deprecation warnings.
   *
   * This must be done after every schemas and deprecation providers have been registered.
   */
  public async validate(params: ConfigValidateParameters = { logDeprecations: true }) {
    const namespaces = [...this.schemas.keys()];
    for (let i = 0; i < namespaces.length; i++) {
      await firstValueFrom(this.getValidatedConfigAtPath$(namespaces[i]));
    }

    if (params.logDeprecations) {
      await this.logDeprecation();
    }

    this.validated = true;
  }

  /**
   * Returns the full config object observable. This is not intended for
   * "normal use", but for internal features that _need_ access to the full object.
   */
  public getConfig$() {
    return this.config$;
  }

  /**
   * Reads the subset of the config at the specified `path` and validates it
   * against its registered schema.
   *
   * @param path - The path to the desired subset of the config.
   * @param ignoreUnchanged - If true (default), will not emit if the config at path did not change.
   */
  public atPath<TSchema>(
    path: ConfigPath,
    { ignoreUnchanged = true }: { ignoreUnchanged?: boolean } = {}
  ) {
    return this.getValidatedConfigAtPath$(path, { ignoreUnchanged }) as Observable<TSchema>;
  }

  /**
   * Similar to {@link atPath}, but return the last emitted value synchronously instead of an
   * observable.
   *
   * @param path - The path to the desired subset of the config.
   */
  public atPathSync<TSchema>(path: ConfigPath) {
    if (!this.validated) {
      throw new Error('`atPathSync` called before config was validated');
    }
    const configAtPath = this.lastConfig!.get(path);
    return this.validateAtPath(path, configAtPath) as TSchema;
  }

  public async isEnabledAtPath(path: ConfigPath) {
    const namespace = pathToString(path);
    const hasSchema = this.schemas.has(namespace);

    const config = await firstValueFrom(this.config$);
    if (!hasSchema && config.has(path)) {
      // Throw if there is no schema, but a config exists at the path.
      throw new Error(`No validation schema has been defined for [${namespace}]`);
    }

    let validatedConfig = hasSchema
      ? await firstValueFrom(
          this.getValidatedConfigAtPath$(
            path,
            // At this point we don't care about how valid the config is: we just want to read `enabled`
            { stripUnknownKeys: true }
          ) as Observable<{ enabled?: boolean }>,
          { defaultValue: undefined }
        )
      : undefined;

    // Special use case: when the provided config includes `enabled` and the validated config doesn't,
    // it's quite likely that's not an allowed config and it should fail.
    // Applying "normal" validation (not stripping unknowns) in that case.
    if (
      hasSchema &&
      typeof config.get(path)?.enabled !== 'undefined' &&
      typeof validatedConfig?.enabled === 'undefined'
    ) {
      validatedConfig = await firstValueFrom(
        this.getValidatedConfigAtPath$(path) as Observable<{ enabled?: boolean }>,
        { defaultValue: undefined }
      );
    }

    const isDisabled = validatedConfig?.enabled === false;
    if (isDisabled) {
      // If the plugin is explicitly disabled, we mark the entire plugin
      // path as handled, as it's expected that it won't be used.
      this.markAsHandled(path);
      return false;
    }

    // If the schema exists and the config is explicitly set to true,
    // _or_ if the `enabled` config is undefined, then we treat the
    // plugin as enabled.
    return true;
  }

  public async getUnusedPaths() {
    const config = await firstValueFrom(this.config$);
    const handledPaths = [...this.handledPaths.values()].map(pathToString);
    return config.getFlattenedPaths().filter((path) => !isPathHandled(path, handledPaths));
  }

  public async getUsedPaths() {
    const config = await firstValueFrom(this.config$);
    const handledPaths = [...this.handledPaths.values()].map(pathToString);
    return config.getFlattenedPaths().filter((path) => isPathHandled(path, handledPaths));
  }

  public getDeprecatedConfigPath$() {
    return this.deprecatedConfigPaths.asObservable();
  }

  /**
   * Adds a specific setting to be allowed to change dynamically.
   * @param configPath The namespace of the config
   * @param dynamicConfigPaths The config keys that can be dynamically changed
   */
  public addDynamicConfigPaths(configPath: ConfigPath, dynamicConfigPaths: string[]) {
    const _configPath = Array.isArray(configPath) ? configPath.join('.') : configPath;
    this.dynamicPaths.set(_configPath, dynamicConfigPaths);
  }

  /**
   * Used for dynamically extending the overrides.
   * These overrides are not persisted and will be discarded after restarts.
   * @param newOverrides
   */
  public setDynamicConfigOverrides(newOverrides: Record<string, unknown>) {
    const globalOverrides = cloneDeep(this.overrides$.value.additions);

    const flattenedOverrides = getFlattenedObject(newOverrides);

    const validateWithNamespace = new Set<string>();

    const flattenedKeysToRemove: string[] = []; // We don't want to remove keys until all the validations have been applied.

    keyLoop: for (const key in flattenedOverrides) {
      // this if is enforced by an eslint rule :shrug:
      if (key in flattenedOverrides) {
        // If set to `null`, delete the config from the overrides.
        if (flattenedOverrides[key] === null) {
          flattenedKeysToRemove.push(key);
          continue;
        }

        for (const [configPath, dynamicConfigKeys] of this.dynamicPaths.entries()) {
          if (
            key.startsWith(`${configPath}.`) &&
            dynamicConfigKeys.some(
              // The key is explicitly allowed OR its prefix is
              (dynamicConfigKey) =>
                key === `${configPath}.${dynamicConfigKey}` ||
                key.startsWith(`${configPath}.${dynamicConfigKey}.`)
            )
          ) {
            validateWithNamespace.add(configPath);
            set(globalOverrides, key, flattenedOverrides[key]);
            continue keyLoop;
          }
        }
        throw new ValidationError(new SchemaTypeError(`not a valid dynamic option`, [key]));
      }
    }

    const rawConfig = merge({}, this.lastConfig, globalOverrides);
    flattenedKeysToRemove.forEach((key) => {
      unset(globalOverrides, key);
      unset(rawConfig, key);
    });
    const globalOverridesAsConfig = new ObjectToConfigAdapter(rawConfig);

    validateWithNamespace.forEach((ns) => this.validateAtPath(ns, globalOverridesAsConfig.get(ns)));

    this.overrides$.next({ additions: globalOverrides, removals: flattenedKeysToRemove });
    return globalOverrides;
  }

  private async logDeprecation() {
    const rawConfig = await firstValueFrom(this.rawConfigProvider.getConfig$());
    const deprecations = await firstValueFrom(this.deprecations);
    const deprecationMessages: string[] = [];
    const createAddDeprecation = (domainId: string) => (context: DeprecatedConfigDetails) => {
      if (!context.silent) {
        deprecationMessages.push(context.message);
      }
      this.markDeprecatedConfigAsHandled(domainId, context);
    };

    applyDeprecations(rawConfig, deprecations, createAddDeprecation);
    deprecationMessages.forEach((msg) => {
      this.deprecationLog.warn(msg);
    });
  }

  private validateAtPath(
    path: ConfigPath,
    config: Record<string, unknown>,
    validateOptions?: { stripUnknownKeys?: boolean }
  ) {
    const stripUnknownKeys = validateOptions?.stripUnknownKeys || this.stripUnknownKeys;

    const namespace = pathToString(path);
    const schema = this.schemas.get(namespace);
    if (!schema) {
      throw new Error(`No validation schema has been defined for [${namespace}]`);
    }
    return schema.validate(
      config,
      {
        dev: this.env.mode.dev,
        prod: this.env.mode.prod,
        serverless: this.env.packageInfo.buildFlavor === 'serverless',
        ...this.env.packageInfo,
      },
      `config validation of [${namespace}]`,
      stripUnknownKeys ? { stripUnknownKeys } : {}
    );
  }

  private getValidatedConfigAtPath$(
    path: ConfigPath,
    {
      ignoreUnchanged = true,
      stripUnknownKeys,
    }: { ignoreUnchanged?: boolean; stripUnknownKeys?: boolean } = {}
  ) {
    return this.config$.pipe(
      map((config) => config.get(path)),
      ignoreUnchanged ? distinctUntilChanged(isEqual) : identity,
      map((config) => this.validateAtPath(path, config, { stripUnknownKeys }))
    );
  }

  private markAsHandled(path: ConfigPath) {
    this.log.debug(`Marking config path as handled: ${path}`);
    this.handledPaths.add(path);
  }

  private markDeprecatedConfigAsHandled(domainId: string, config: DeprecatedConfigDetails) {
    const handledDeprecatedConfig = this.handledDeprecatedConfigs.get(domainId) || [];
    handledDeprecatedConfig.push(config);
    this.handledDeprecatedConfigs.set(domainId, handledDeprecatedConfig);
  }

  private createDeprecationContext(): ConfigDeprecationContext {
    return {
      branch: this.env.packageInfo.branch,
      version: this.env.packageInfo.version,
      docLinks: this.docLinks,
    };
  }
}

const pathToString = (path: ConfigPath) => (Array.isArray(path) ? path.join('.') : path);

/**
 * A path is considered 'handled' if it is a subset of any of the already
 * handled paths.
 */
const isPathHandled = (path: string, handledPaths: string[]) =>
  handledPaths.some((handledPath) => hasConfigPathIntersection(path, handledPath));
