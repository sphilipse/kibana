/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { EuiLink, EuiToolTip } from '@elastic/eui';
import React from 'react';
import { i18n } from '@kbn/i18n';
import { useModelSettingsUrl } from '../../hooks/use_model_settings_url';

export function EnableAIFeaturesLink() {
  const modelSettingsUrl = useModelSettingsUrl();

  if (!modelSettingsUrl) {
    return null;
  }

  return (
    <EuiToolTip
      content={i18n.translate('xpack.streams.enableAIFeaturesLink.tooltipContent', {
        defaultMessage:
          'AI Assistant features are not enabled. To enable features, add a model on the management page.',
      })}
    >
<<<<<<< inference-move-connectors-management-to-feature-settings
      <EuiLink
        target="_blank"
        href={http.basePath.prepend(`/app/management/modelManagement/model_settings`)}
      >
=======
      <EuiLink target="_blank" href={modelSettingsUrl}>
>>>>>>> main
        {i18n.translate('xpack.streams.enableAIFeaturesLink.linkLabel', {
          defaultMessage: 'Enable AI Assistant features',
        })}
      </EuiLink>
    </EuiToolTip>
  );
}
