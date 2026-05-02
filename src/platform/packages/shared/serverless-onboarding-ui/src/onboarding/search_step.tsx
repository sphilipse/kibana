/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { EuiCallOut, EuiCode, EuiSpacer, EuiText } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { Redirect, useHistory } from 'react-router-dom';
import { useKibana } from '../services';
import { ApiStep } from './api_step';
import { getSearchSnippets } from './language_snippets';
import { getSearchSnippet } from './snippets';
import { StepLayout } from './step_layout';
import { pathQuery, useWizardPath } from './use_wizard_path';

export const SearchStep: React.FC = () => {
  const history = useHistory();
  const path = useWizardPath();
  const {
    services: { docLinks },
  } = useKibana();

  if (!path) return <Redirect to="/" />;

  const isGenerate = path === 'generate-vectors';
  const docsHref = isGenerate
    ? docLinks.links.enterpriseSearch.semanticSearch
    : docLinks.links.enterpriseSearch.knnSearch;

  return (
    <StepLayout
      currentStep={3}
      title={
        isGenerate
          ? i18n.translate('xpack.serverlessVectordb.search.generate.title', {
              defaultMessage: 'Search with natural language',
            })
          : i18n.translate('xpack.serverlessVectordb.search.have.title', {
              defaultMessage: 'Run a kNN query',
            })
      }
      docsLabel={i18n.translate('xpack.serverlessVectordb.search.docsLabel', {
        defaultMessage: 'Search docs',
      })}
      docsHref={docsHref}
      onSkip={() => history.push('/dashboard')}
      onBack={() => history.push(`/ingest${pathQuery(path)}`)}
      onNext={() => history.push('/dashboard')}
      nextLabel={i18n.translate('xpack.serverlessVectordb.search.done', {
        defaultMessage: 'Done',
      })}
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
                  id="xpack.serverlessVectordb.search.have.callout"
                  defaultMessage="Tune {numCandidates} to trade off speed against accuracy."
                  values={{
                    numCandidates: (
                      <>
                        <EuiCode>num_candidates</EuiCode>
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

      <ApiStep snippets={getSearchSnippets(path)} consoleRequest={getSearchSnippet(path)} />
    </StepLayout>
  );
};
