/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { REPO_ROOT } from '@kbn/repo-info';
import { createAbsolutePathSerializer } from '@kbn/jest-serializers';

import { Config } from './config';
import { Build } from './build';

expect.addSnapshotSerializer(createAbsolutePathSerializer());

const config = new Config(
  true,
  false,
  {
    version: '8.0.0',
    engines: {
      node: '*',
    },
    workspaces: {
      packages: [],
    },
  } as any,
  '1.2.3',
  REPO_ROOT,
  {
    buildNumber: 1234,
    buildSha: 'abcd1234',
    buildShaShort: 'abcd',
    buildVersion: '8.0.0',
    buildDate: '2023-05-15T23:12:09+0000',
  },
  false,
  false,
  null,
  '',
  '',
  false,
  true,
  true,
  {},
  {}
);

const linuxPlatform = config.getPlatform('linux', 'x64');
const linuxArmPlatform = config.getPlatform('linux', 'arm64');
const windowsPlatform = config.getPlatform('win32', 'x64');

beforeEach(() => {
  jest.clearAllMocks();
});

const defaultBuild = new Build(config);

describe('#getName()', () => {
  it('returns kibana for default build', () => {
    expect(defaultBuild.getName()).toBe('kibana');
  });
});

describe('#getLogTag()', () => {
  it('returns string with build name in it', () => {
    expect(defaultBuild.getLogTag()).toContain(defaultBuild.getName());
  });
});

describe('#resolvePath()', () => {
  it('uses passed config to resolve a path relative to the repo', () => {
    expect(defaultBuild.resolvePath('bar')).toMatchInlineSnapshot(
      `<absolute path>/build/kibana/bar`
    );
  });

  it('passes all arguments to config.resolveFromRepo()', () => {
    expect(defaultBuild.resolvePath('bar', 'baz', 'box')).toMatchInlineSnapshot(
      `<absolute path>/build/kibana/bar/baz/box`
    );
  });
});

describe('#resolvePathForPlatform()', () => {
  it('uses config.resolveFromRepo(), config.getBuildVersion(), and platform.getBuildName() to create path', () => {
    expect(defaultBuild.resolvePathForPlatform(linuxPlatform, 'foo', 'bar')).toMatchInlineSnapshot(
      `<absolute path>/build/default/kibana-8.0.0-linux-x86_64/foo/bar`
    );
  });
});

describe('#getPlatformArchivePath()', () => {
  it('creates correct path for different platforms', () => {
    expect(defaultBuild.getPlatformArchivePath(linuxPlatform)).toMatchInlineSnapshot(
      `<absolute path>/target/kibana-8.0.0-linux-x86_64.tar.gz`
    );
    expect(defaultBuild.getPlatformArchivePath(linuxArmPlatform)).toMatchInlineSnapshot(
      `<absolute path>/target/kibana-8.0.0-linux-aarch64.tar.gz`
    );
    expect(defaultBuild.getPlatformArchivePath(windowsPlatform)).toMatchInlineSnapshot(
      `<absolute path>/target/kibana-8.0.0-windows-x86_64.zip`
    );
  });

  describe('#getRootDirectory()', () => {
    it('creates correct root directory name', () => {
      expect(defaultBuild.getRootDirectory()).toMatchInlineSnapshot(`"kibana-8.0.0"`);
    });
  });
});
