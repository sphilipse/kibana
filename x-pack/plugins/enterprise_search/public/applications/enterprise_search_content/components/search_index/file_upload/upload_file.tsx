/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';

import { useValues, useActions } from 'kea';

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiButtonEmpty,
  EuiFilePicker,
  EuiSpacer,
  EuiText,
  EuiPanel,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';

import { CANCEL_BUTTON_LABEL, CONTINUE_BUTTON_LABEL } from '../../../../shared/constants';

import { FileUploadLogic } from './file_upload_logic';

export const UploadFile: React.FC = () => {
  const { fileInput, isInvalidJson, isUploading } = useValues(FileUploadLogic);
  const { setFileInput, submitFile } = useActions(FileUploadLogic);

  return (
    <>
      <EuiText color="subdued">
        <p>
          {i18n.translate(
            'xpack.enterpriseSearch.appSearch.documentCreation.uploadJsonFile.label',
            {
              defaultMessage:
                'If you have a .json file, drag and drop or upload it. Ensure the JSON is valid and that each document object is less than {maxDocumentByteSize} bytes.',
              values: { maxDocumentByteSize: 10000 },
            }
          )}
        </p>
      </EuiText>
      <EuiSpacer />
      <EuiPanel hasShadow={false}>
        <EuiFlexGroup justifyContent="center">
          <EuiFlexItem grow={false}>
            <EuiFilePicker
              onChange={(files) => setFileInput(files?.length ? files[0] : null)}
              accept="application/json"
              isLoading={isUploading}
              isInvalid={isInvalidJson}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
      <EuiFlexGroup justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty onClick={() => setFileInput(null)}>{CANCEL_BUTTON_LABEL}</EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton fill onClick={submitFile} isLoading={isUploading} isDisabled={!fileInput}>
            {CONTINUE_BUTTON_LABEL}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};
