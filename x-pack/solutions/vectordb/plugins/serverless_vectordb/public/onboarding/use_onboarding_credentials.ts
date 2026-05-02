/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useEffect, useState } from 'react';
import { useKibana } from '../hooks/use_kibana';

const SESSION_KEY = 'vectordb.onboarding.apiKey';

interface CachedKey {
  id: string;
  name: string;
  encoded: string;
}

const readCachedKey = (): CachedKey | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as CachedKey) : null;
  } catch {
    return null;
  }
};

const writeCachedKey = (key: CachedKey) => {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(key));
  } catch {
    // sessionStorage unavailable (e.g. private browsing) — proceed without caching
  }
};

export interface OnboardingCredentials {
  elasticsearchUrl: string | null;
  apiKey: string | null;
  isLoading: boolean;
}

export const useOnboardingCredentials = (): OnboardingCredentials => {
  const {
    services: { http, cloud },
  } = useKibana();
  const [elasticsearchUrl, setElasticsearchUrl] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(() => readCachedKey()?.encoded ?? null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const urlPromise = cloud
      ? cloud
          .fetchElasticsearchConfig()
          .then((c) => c.elasticsearchUrl ?? null)
          .catch(() => null)
      : Promise.resolve(null);

    const cached = readCachedKey();
    const keyPromise: Promise<string | null> = cached
      ? Promise.resolve(cached.encoded)
      : http
          .post<CachedKey>('/internal/serverless_vectordb/api_key', {
            body: JSON.stringify({}),
          })
          .then((result) => {
            writeCachedKey(result);
            return result.encoded;
          })
          .catch(() => null);

    Promise.all([urlPromise, keyPromise]).then(([url, key]) => {
      if (cancelled) return;
      setElasticsearchUrl(url);
      setApiKey(key);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [http, cloud]);

  return { elasticsearchUrl, apiKey, isLoading };
};
