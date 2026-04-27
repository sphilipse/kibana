/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { css } from '@emotion/react';
import { EuiButtonEmpty, EuiIcon, EuiPopover, EuiSelectable } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { EuiSelectableOption } from '@elastic/eui';
import { useConnectors } from '../../hooks/use_connectors';
import { useQueryInferenceEndpoints } from '../../hooks/use_inference_endpoints';
import { mergeConnectorsAndEndpoints } from '../../utils/connector_display';

interface AddModelPopoverProps {
  existingEndpointIds: string[];
  onAdd: (endpointId: string) => void;
  taskType?: string;
  panelWidth?: number;
}

export const AddModelPopover: React.FC<AddModelPopoverProps> = ({
  existingEndpointIds,
  onAdd,
  taskType,
  panelWidth,
}) => {
  const { data: connectors = [] } = useConnectors();
  const { data: inferenceEndpoints = [] } = useQueryInferenceEndpoints();
  const [isOpen, setIsOpen] = useState(false);

  const allModels = useMemo(
    () => mergeConnectorsAndEndpoints(connectors, inferenceEndpoints),
    [connectors, inferenceEndpoints]
  );

  const options: EuiSelectableOption[] = useMemo(() => {
    const existingSet = new Set(existingEndpointIds);
    const available = allModels.filter(
      (model) =>
        !existingSet.has(model.id) && (!taskType || model.taskType === taskType)
    );

    const nameToCount = allModels.reduce<Map<string, number>>((acc, model) => {
      acc.set(model.name, (acc.get(model.name) ?? 0) + 1);
      return acc;
    }, new Map());

    return available.map((model) => {
      const count = nameToCount.get(model.name) ?? 1;
      const label = count > 1 ? `${model.name} (${model.id})` : model.name;
      return {
        label,
        key: model.id,
        prepend: <EuiIcon type={model.icon} size="s" aria-hidden />,
      };
    });
  }, [allModels, existingEndpointIds, taskType]);

  const handleChange = useCallback(
    (newOptions: EuiSelectableOption[]) => {
      const selected = newOptions.find((opt) => opt.checked === 'on');
      if (selected?.key) {
        onAdd(selected.key);
        setIsOpen(false);
      }
    },
    [onAdd]
  );

  return (
    <EuiPopover
      button={
        <EuiButtonEmpty
          iconType="plusInCircle"
          onClick={() => setIsOpen((prev) => !prev)}
          size="s"
          data-test-subj="add-model-button"
          color="text"
        >
          {i18n.translate('xpack.searchInferenceEndpoints.settings.addModel', {
            defaultMessage: 'Add a model',
          })}
        </EuiButtonEmpty>
      }
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      panelPaddingSize="s"
      anchorPosition="downLeft"
      panelProps={
        panelWidth
          ? {
              css: css`
                width: ${panelWidth}px;
              `,
            }
          : undefined
      }
    >
      <EuiSelectable
        options={options}
        onChange={handleChange}
        singleSelection
        searchable
        data-test-subj="add-model-selectable"
        searchProps={{
          placeholder: i18n.translate('xpack.searchInferenceEndpoints.settings.addModel.search', {
            defaultMessage: 'Search models...',
          }),
          'data-test-subj': 'add-model-search',
        }}
        listProps={{ bordered: false, showIcons: false }}
        height={300}
      >
        {(list, search) => (
          <>
            {search}
            {list}
          </>
        )}
      </EuiSelectable>
    </EuiPopover>
  );
};
