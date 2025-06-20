/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { basename } from 'path';

import { Config, Platform } from '../../lib';

export function getNodeDownloadInfo(config: Config, platform: Platform) {
  const version = config.getNodeVersion();
  const arch = platform.getNodeArch();
  let variants = ['default'];
  if (platform.isLinux()) {
    // CI_FORCE_NODE_POINTER_COMPRESSION is an override for running all tests with pointer compression enabled
    if (Boolean(process.env.CI_FORCE_NODE_POINTER_COMPRESSION) && !platform.isServerless()) {
      variants = ['pointer-compression'];
    } else {
      variants = ['glibc-217'];
    }
    // disabled, see https://github.com/nodejs/node/issues/54531
    // if (platform.isServerless()) variants.push('pointer-compression');
  }

  return variants.map((variant) => {
    const downloadName = platform.isWindows()
      ? `win-${platform.getArchitecture()}/node.exe`
      : `node-v${version}-${arch}.tar.gz`;

    let variantPath = '';
    if (variant === 'pointer-compression') variantPath = 'node-pointer-compression/';
    if (variant === 'glibc-217') variantPath = 'node-glibc-217/';
    const url = `https://us-central1-elastic-kibana-184716.cloudfunctions.net/kibana-ci-proxy-cache/${variantPath}dist/v${version}/${downloadName}`;
    const downloadPath = config.resolveFromRepo(
      '.node_binaries',
      version,
      variant,
      platform.getNodeArch(),
      'download',
      basename(downloadName)
    );
    const extractDir = config.resolveFromRepo(
      '.node_binaries',
      version,
      variant,
      platform.getNodeArch(),
      'extract'
    );

    return {
      url,
      downloadName,
      downloadPath,
      extractDir,
      variant,
      version,
    };
  });
}
