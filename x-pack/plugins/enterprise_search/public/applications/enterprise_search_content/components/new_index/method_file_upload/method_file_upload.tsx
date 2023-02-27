/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';

import { useValues, useActions } from 'kea';

import { EuiFlexGroup, EuiFlexItem, EuiSteps, EuiText } from '@elastic/eui';

import { i18n } from '@kbn/i18n';

import { Status } from '../../../../../../common/types/api';
import { ServiceTypes } from '../../../../../../common/types/connectors';
import { AddConnectorApiLogic } from '../../../api/connector/add_connector_api_logic';
import { CREATE_ELASTICSEARCH_INDEX_STEP, BUILD_SEARCH_EXPERIENCE_STEP } from '../method_steps';
import { NewSearchIndexTemplate } from '../new_search_index_template';

import { MethodFileUploadLogic } from './method_file_upload_logic';

export const MethodFileUpload: React.FC = () => {
  const { status } = useValues(AddConnectorApiLogic);
  const { makeRequest } = useActions(AddConnectorApiLogic);

  MethodFileUploadLogic.mount();

  return (
    <EuiFlexGroup direction="column">
      <EuiFlexItem>
        <NewSearchIndexTemplate
          title={i18n.translate(
            'xpack.enterpriseSearch.content.newIndex.steps.createIndex.fileUpload.title',
            {
              defaultMessage: 'Search your data by uploading a file',
            }
          )}
          type="fileUpload"
          onSubmit={(indexName, language) =>
            makeRequest({
              indexName,
              isNative: false,
              language,
              serviceType: ServiceTypes.FILE_UPLOAD,
            })
          }
          buttonLoading={status === Status.LOADING}
          docsUrl={'TODOTODO'}
        >
          <EuiSteps
            steps={[
              CREATE_ELASTICSEARCH_INDEX_STEP,
              {
                children: (
                  <EuiText size="s">
                    <p>
                      {i18n.translate(
                        'xpack.enterpriseSearch.content.newIndex.methodFileUpload.steps.configureIngestion.content',
                        {
                          defaultMessage:
                            'Ingest your data by uploading a file. Let Enterprise Search do the rest.',
                        }
                      )}
                    </p>
                  </EuiText>
                ),
                status: 'incomplete',
                title: i18n.translate(
                  'xpack.enterpriseSearch.content.newIndex.steps.configureIngestion.title',
                  {
                    defaultMessage: 'Upload a file',
                  }
                ),
                titleSize: 'xs',
              },
              BUILD_SEARCH_EXPERIENCE_STEP,
            ]}
          />
        </NewSearchIndexTemplate>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
