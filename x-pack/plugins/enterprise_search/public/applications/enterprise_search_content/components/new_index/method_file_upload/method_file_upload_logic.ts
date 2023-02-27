/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { kea, MakeLogicType } from 'kea';

import { Actions } from '../../../../shared/api_logic/create_api_logic';
import { generateEncodedPath } from '../../../../shared/encode_path_params';

import { KibanaLogic } from '../../../../shared/kibana';
import {
  AddConnectorApiLogic,
  AddConnectorApiLogicArgs,
  AddConnectorApiLogicResponse,
} from '../../../api/connector/add_connector_api_logic';
import { SEARCH_INDEX_TAB_PATH } from '../../../routes';
import { SearchIndexTabId } from '../../search_index/search_index';

type MethodFileUploadActions = Pick<
  Actions<AddConnectorApiLogicArgs, AddConnectorApiLogicResponse>,
  'apiSuccess'
>;

export const MethodFileUploadLogic = kea<MakeLogicType<{}, MethodFileUploadActions>>({
  connect: {
    actions: [AddConnectorApiLogic, ['apiSuccess']],
  },
  listeners: {
    apiSuccess: ({ indexName }) => {
      KibanaLogic.values.navigateToUrl(
        generateEncodedPath(SEARCH_INDEX_TAB_PATH, {
          indexName,
          tabId: SearchIndexTabId.UPLOAD_FILE,
        })
      );
    },
  },
  path: ['enterprise_search', 'content', 'method_file_upload'],
});
