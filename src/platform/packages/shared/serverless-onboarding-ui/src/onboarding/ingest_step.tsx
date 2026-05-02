/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { EuiCallOut, EuiCode, EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiText } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { Redirect, useHistory } from 'react-router-dom';
import { useKibana } from '../services';
import { ApiStep } from './api_step';
import { getIngestSnippets } from './language_snippets';
import { getPrompt, getIngestSnippet } from './snippets';
import { StepLayout } from './step_layout';
import { pathQuery, useWizardPath } from './use_wizard_path';

export const IngestStep: React.FC = () => {
  const history = useHistory();
  const path = useWizardPath();
  const {
    services: { docLinks },
  } = useKibana();

  if (!path) return <Redirect to="/onboarding" />;

  const isGenerate = path === 'generate-vectors';
  const docsHref = isGenerate
    ? docLinks.links.enterpriseSearch.semanticTextField
    : docLinks.links.enterpriseSearch.knnSearch;

  return (
    <StepLayout
      currentStep={2}
      title={
        isGenerate
          ? i18n.translate('serverlessOnboarding.ingest.generate.title', {
              defaultMessage: 'Index plain text',
            })
          : i18n.translate('serverlessOnboarding.ingest.have.title', {
              defaultMessage: 'Index your embeddings',
            })
      }
      description={
        isGenerate
          ? i18n.translate('serverlessOnboarding.ingest.generate.description', {
              defaultMessage:
                "Create the index, then ingest your data. We use Elastic's state of the art Jina models to generate your vectors.",
            })
          : i18n.translate('serverlessOnboarding.ingest.have.description', {
              defaultMessage:
                'Create the index with the right dimensions, then ingest your vectors. We quantize the vectors for you to save space and speed up search.',
            })
      }
      docsLabel={i18n.translate('serverlessOnboarding.ingest.docsLabel', {
        defaultMessage: 'Learn more',
      })}
      docsHref={docsHref}
      onSkip={() => history.push('/')}
      onBack={() => history.push(`/onboarding${pathQuery(path)}`)}
      onNext={() => history.push(`/onboarding/search${pathQuery(path)}`)}
    >
      {!isGenerate ? (
        <>
          <EuiCallOut
            announceOnMount
            color="primary"
            size="s"
            title={
              <EuiText size="xs">
                <FormattedMessage
                  id="serverlessOnboarding.ingest.have.callout"
                  defaultMessage="Set {dims} to your model's output size and {similarity} to match how it was trained."
                  values={{
                    dims: <EuiCode>dims</EuiCode>,
                    similarity: (
                      <>
                        <EuiCode>similarity</EuiCode>
                      </>
                    ),
                  }}
                />
              </EuiText>
            }
          />
          <EuiSpacer size="m" />
        </>
      ) : null}

      <ApiStep
        snippets={getIngestSnippets(path)}
        consoleRequest={getIngestSnippet(path)}
        prompt={getPrompt(path)}
      />

      <EuiSpacer size="m" />
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiText size="xs" color="subdued">
            <FormattedMessage
              id="serverlessOnboarding.ingest.claudeHint"
              defaultMessage="Want this in your codebase? {prompt} helps your coding assistant generate the right code for you."
              values={{
                prompt: (
                  <strong>
                    {i18n.translate('serverlessOnboarding.ingest.claudeHint.prompt', {
                      defaultMessage: 'Copy prompt',
                    })}
                  </strong>
                ),
              }}
            />
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    </StepLayout>
  );
};
