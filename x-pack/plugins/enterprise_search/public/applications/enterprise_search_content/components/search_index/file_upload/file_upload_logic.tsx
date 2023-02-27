/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import dedent from 'dedent';
import { kea, MakeLogicType } from 'kea';
import { isPlainObject } from 'lodash';

import { Status } from '../../../../../../common/types/api';

import {
  IndexDocumentsActions,
  IndexDocumentsApiLogic,
} from '../../../api/connector/index_documents_api_logic';
import { IndexNameLogic } from '../index_name_logic';
import { IndexViewLogic } from '../index_view_logic';

import { readUploadedFileAsText } from './utils';

export type ActiveJsonTab = 'uploadTab' | 'pasteTab';

interface FileUploadValues {
  errors: string[];
  fileInput: File | null;
  indexName: string;
  isFileTooLarge: boolean;
  isInvalidJson: boolean;
  isUploading: boolean;
  pipelineData: typeof IndexViewLogic.values.pipelineData;
  status: Status;
  textInput: string;
  warnings: string[];
}

interface FileUploadActions {
  indexDocuments: IndexDocumentsActions['makeRequest'];
  setFileInput(fileInput: File | null): { fileInput: File | null };
  setIsFileTooLarge(isFileTooLarge: boolean): { isFileTooLarge: boolean };
  setIsInvalidJson(isInvalidJson: boolean): { isInvalidJson: boolean };
  setTextInput(textInput: string): { textInput: string };
  submitFile(): void;
  submitJson(): void;
  uploadDocuments(args: { documents: object[] }): { documents: object[] };
}

const JSON_EXAMPLE = `{
  id: 'park_rocky-mountain',
  title: 'Rocky Mountain',
  description:
    'Bisected north to south by the Continental Divide, this portion of the Rockies has ecosystems varying from over 150 riparian lakes to montane and subalpine forests to treeless alpine tundra. Wildlife including mule deer, bighorn sheep, black bears, and cougars inhabit its igneous mountains and glacial valleys. Longs Peak, a classic Colorado fourteener, and the scenic Bear Lake are popular destinations, as well as the historic Trail Ridge Road, which reaches an elevation of more than 12,000 feet (3,700 m).',
  nps_link: 'https://www.nps.gov/romo/index.htm',
  states: ['Colorado'],
  visitors: 4517585,
  world_heritage_site: false,
  location: '40.4,-105.58',
  acres: 265795.2,
  square_km: 1075.6,
  date_established: '1915-01-26T06:00:00Z',
}`;

export const FileUploadLogic = kea<MakeLogicType<FileUploadValues, FileUploadActions>>({
  actions: () => ({
    setFileInput: (fileInput) => ({ fileInput }),
    setIsFileTooLarge: (isFileTooLarge) => ({ isFileTooLarge }),
    setIsInvalidJson: (isInvalidJson) => ({ isInvalidJson }),
    setTextInput: (textInput) => ({ textInput }),
    submitFile: () => null,
    submitJson: () => null,
    uploadDocuments: ({ documents }) => ({ documents }),
  }),
  connect: {
    actions: [IndexDocumentsApiLogic, ['makeRequest as indexDocuments']],
    values: [
      IndexDocumentsApiLogic,
      ['status'],
      IndexNameLogic,
      ['indexName'],
      IndexViewLogic,
      ['pipelineData'],
    ],
  },
  listeners: ({ values, actions }) => ({
    submitFile: async () => {
      const { fileInput } = values;

      if (!fileInput) {
        return;
      }
      try {
        const textInput = await readUploadedFileAsText(fileInput);
        actions.setTextInput(textInput);
        actions.submitJson();
      } catch {
        actions.setIsInvalidJson(true);
      }
    },
    submitJson: () => {
      const { textInput } = values;

      const MAX_UPLOAD_BYTES = 50 * 1000000; // 50 MB
      if (Buffer.byteLength(textInput) > MAX_UPLOAD_BYTES) {
        actions.setIsFileTooLarge(true);
      }

      let documents;
      try {
        documents = JSON.parse(textInput);
      } catch (error) {
        return actions.setIsInvalidJson(true);
      }
      const { indexName, pipelineData: pipeline } = values;
      if (Array.isArray(documents)) {
        actions.indexDocuments({ documents, indexName, pipeline });
      } else if (isPlainObject(documents)) {
        actions.indexDocuments({ documents: [documents], indexName, pipeline });
      } else {
        // TODO: can we even get here?
        return;
      }
    },
  }),
  path: ['enterprise_search', 'content', 'file_upload_logic'],
  reducers: () => ({
    fileInput: [
      null,
      {
        setFileInput: (_, { fileInput }) => fileInput,
      },
    ],
    isFileTooLarge: [false, { setIsFileTooLarge: (_, { isFileTooLarge }) => isFileTooLarge }],
    isInvalidJson: [
      false,
      { setFile: () => false, setIsInvalidJson: (_, { isInvalidJson }) => isInvalidJson },
    ],
    textInput: [
      dedent(JSON_EXAMPLE),
      {
        setTextInput: (_, { textInput }) => textInput,
      },
    ],
  }),
  selectors: ({ selectors }) => ({
    isUploading: [() => [selectors.status], (status: Status) => status === Status.LOADING],
  }),
});
