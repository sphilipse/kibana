/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { storiesOf } from '@storybook/react';
import { coreMock } from '@kbn/core/public/mocks';
import { elasticOutline, elasticLogo } from '@kbn/expression-utils';
import { Render } from '@kbn/presentation-util-plugin/public/__stories__';
import { getRevealImageRenderer } from '..';
import { Origin } from '../../../common/types/expression_functions';

const Renderer = () => {
  const config = {
    image: elasticLogo,
    emptyImage: elasticOutline,
    origin: Origin.LEFT,
    percent: 0.45,
  };

  return <Render renderer={getRevealImageRenderer(coreMock.createStart())} config={config} />;
};

storiesOf('renderers/revealImage', module).add('default', (_, props) => <Renderer />, {
  decorators: [],
});
