/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import {
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { useHistory } from 'react-router-dom';
import type { VectorPath } from './snippets';
import { StepLayout } from './step_layout';
import { pathQuery } from './use_wizard_path';

export const PathStep: React.FC = () => {
  const history = useHistory();

  const choose = (path: VectorPath) => history.push(`/ingest${pathQuery(path)}`);

  return (
    <StepLayout currentStep={1} variant="hero" onSkip={() => history.push('/dashboard')}>
      <div style={{ textAlign: 'center' }}>
        <EuiTitle size="l">
          <h1>
            {i18n.translate('xpack.serverlessVectordb.path.title', {
              defaultMessage: 'Do you already have vectors?',
            })}
          </h1>
        </EuiTitle>
        <EuiSpacer size="m" />
        <EuiText size="m" color="subdued">
          <p>
            {i18n.translate('xpack.serverlessVectordb.path.description', {
              defaultMessage: 'Not sure? Let us generate the vectors for you.',
            })}
          </p>
        </EuiText>
      </div>

      <EuiSpacer size="xxl" />

      <EuiFlexGroup gutterSize="xl">
        <EuiFlexItem>
          <EuiCard
            data-test-subj="vectordbPathHave"
            icon={<EuiIcon type="tokenVectorDense" size="xxl" color="primary" aria-hidden />}
            title={i18n.translate('xpack.serverlessVectordb.path.have.label', {
              defaultMessage: 'I already have vectors',
            })}
            paddingSize="l"
            textAlign="center"
            description={
              <FormattedMessage
                id="xpack.serverlessVectordb.path.generate.description"
                defaultMessage="Just ingest your vectors and we'll handle the rest, using quantization to optimize storage and search latency."
              />
            }
            onClick={() => choose('have-vectors')}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiCard
            data-test-subj="vectordbPathGenerate"
            icon={<EuiIcon type="tokenSemanticText" size="xxl" color="accent" aria-hidden />}
            title={i18n.translate('xpack.serverlessVectordb.path.generate.label', {
              defaultMessage: 'Generate vectors for me',
            })}
            paddingSize="l"
            textAlign="center"
            onClick={() => choose('generate-vectors')}
            description={
              <FormattedMessage
                id="xpack.serverlessVectordb.path.generate.description"
                defaultMessage="Just ingest your text documents and we'll use our state of the art models to generate the vectors."
              />
            }
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </StepLayout>
  );
};
