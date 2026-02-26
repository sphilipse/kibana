/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  EuiAccordion,
  EuiButton,
  EuiCallOut,
  EuiEmptyPrompt,
  EuiLoadingSpinner,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { CodeEditor } from '@kbn/code-editor';

import type { IndexConfigResponse, PipelineInfo } from '../../types';

interface IndexConfigPanelProps {
  indexConfig?: IndexConfigResponse;
  pipelines: PipelineInfo[];
  indices: string[];
  isLoading: boolean;
  isError: boolean;
  onSaveSettings: (index: string, settings: Record<string, unknown>) => void;
  onSaveMappings: (index: string, mappings: Record<string, unknown>) => void;
  onSavePipeline: (id: string, description: string | undefined, processors: unknown[]) => void;
  isSavingSettings: boolean;
  isSavingMappings: boolean;
  isSavingPipeline: boolean;
}

export const IndexConfigPanel: React.FC<IndexConfigPanelProps> = ({
  indexConfig,
  pipelines,
  indices,
  isLoading,
  isError,
  onSaveSettings,
  onSaveMappings,
  onSavePipeline,
  isSavingSettings,
  isSavingMappings,
  isSavingPipeline,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<string>(indices[0] ?? '');
  const [settingsJSON, setSettingsJSON] = useState<string>('');
  const [mappingsJSON, setMappingsJSON] = useState<string>('');
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [pipelineJSON, setPipelineJSON] = useState<string>('');
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [mappingsDirty, setMappingsDirty] = useState(false);
  const [pipelineDirty, setPipelineDirty] = useState(false);

  const indexOptions = useMemo(
    () => indices.map((idx) => ({ value: idx, text: idx })),
    [indices]
  );

  const pipelineOptions = useMemo(
    () => [
      {
        value: '',
        text: i18n.translate('xpack.searchPlayground.relevance.indexConfig.selectPipeline', {
          defaultMessage: '-- Select a pipeline --',
        }),
      },
      ...pipelines.map((p) => ({
        value: p.id,
        text: p.description ? `${p.id} (${p.description})` : p.id,
      })),
    ],
    [pipelines]
  );

  const handleIndexChange = useCallback(
    (newIndex: string) => {
      setSelectedIndex(newIndex);
      setSettingsDirty(false);
      setMappingsDirty(false);
      if (indexConfig) {
        const settings = indexConfig.settings[newIndex] ?? {};
        const mappings = indexConfig.mappings[newIndex] ?? {};
        setSettingsJSON(JSON.stringify(settings, null, 2));
        setMappingsJSON(JSON.stringify(mappings, null, 2));
      }
    },
    [indexConfig]
  );

  React.useEffect(() => {
    if (indexConfig && selectedIndex) {
      const settings = indexConfig.settings[selectedIndex] ?? {};
      const mappings = indexConfig.mappings[selectedIndex] ?? {};
      setSettingsJSON(JSON.stringify(settings, null, 2));
      setMappingsJSON(JSON.stringify(mappings, null, 2));
      setSettingsDirty(false);
      setMappingsDirty(false);
    }
  }, [indexConfig, selectedIndex]);

  React.useEffect(() => {
    if (selectedPipelineId) {
      const pipeline = pipelines.find((p) => p.id === selectedPipelineId);
      if (pipeline) {
        setPipelineJSON(JSON.stringify(pipeline, null, 2));
        setPipelineDirty(false);
      }
    }
  }, [pipelines, selectedPipelineId]);

  const handlePipelineChange = useCallback(
    (pipelineId: string) => {
      setSelectedPipelineId(pipelineId);
      setPipelineDirty(false);
      const pipeline = pipelines.find((p) => p.id === pipelineId);
      if (pipeline) {
        setPipelineJSON(JSON.stringify(pipeline, null, 2));
      } else {
        setPipelineJSON('');
      }
    },
    [pipelines]
  );

  const isSettingsValid = useMemo(() => {
    try {
      JSON.parse(settingsJSON);
      return true;
    } catch {
      return false;
    }
  }, [settingsJSON]);

  const isMappingsValid = useMemo(() => {
    try {
      JSON.parse(mappingsJSON);
      return true;
    } catch {
      return false;
    }
  }, [mappingsJSON]);

  const isPipelineValid = useMemo(() => {
    if (!pipelineJSON) return false;
    try {
      const parsed = JSON.parse(pipelineJSON);
      return Array.isArray(parsed.processors);
    } catch {
      return false;
    }
  }, [pipelineJSON]);

  const handleSaveSettings = useCallback(() => {
    if (!isSettingsValid || !selectedIndex) return;
    onSaveSettings(selectedIndex, JSON.parse(settingsJSON));
  }, [isSettingsValid, selectedIndex, settingsJSON, onSaveSettings]);

  const handleSaveMappings = useCallback(() => {
    if (!isMappingsValid || !selectedIndex) return;
    onSaveMappings(selectedIndex, JSON.parse(mappingsJSON));
  }, [isMappingsValid, selectedIndex, mappingsJSON, onSaveMappings]);

  const handleSavePipeline = useCallback(() => {
    if (!isPipelineValid || !selectedPipelineId) return;
    const parsed = JSON.parse(pipelineJSON);
    onSavePipeline(selectedPipelineId, parsed.description, parsed.processors);
  }, [isPipelineValid, selectedPipelineId, pipelineJSON, onSavePipeline]);

  if (isLoading) {
    return (
      <EuiPanel data-test-subj="indexConfigPanel" paddingSize="l">
        <EuiLoadingSpinner size="l" data-test-subj="indexConfigLoading" />
      </EuiPanel>
    );
  }

  if (isError || !indexConfig) {
    return (
      <EuiPanel data-test-subj="indexConfigPanel" paddingSize="l">
        <EuiEmptyPrompt
          data-test-subj="indexConfigError"
          iconType="warning"
          title={
            <h3>
              <FormattedMessage
                id="xpack.searchPlayground.relevance.indexConfig.errorTitle"
                defaultMessage="Unable to load index configuration"
              />
            </h3>
          }
        />
      </EuiPanel>
    );
  }

  return (
    <EuiPanel data-test-subj="indexConfigPanel" paddingSize="l">
      <EuiTitle size="s">
        <h3>
          <FormattedMessage
            id="xpack.searchPlayground.relevance.indexConfig.title"
            defaultMessage="Index Configuration"
          />
        </h3>
      </EuiTitle>

      <EuiSpacer size="m" />

      {indices.length > 1 && (
        <>
          <EuiSelect
            data-test-subj="indexConfigIndexSelect"
            options={indexOptions}
            value={selectedIndex}
            onChange={(e) => handleIndexChange(e.target.value)}
            fullWidth
            prepend={i18n.translate('xpack.searchPlayground.relevance.indexConfig.indexLabel', {
              defaultMessage: 'Index',
            })}
          />
          <EuiSpacer size="m" />
        </>
      )}

      <EuiAccordion
        id="index-settings-accordion"
        buttonContent={i18n.translate(
          'xpack.searchPlayground.relevance.indexConfig.settingsAccordion',
          { defaultMessage: 'Settings' }
        )}
        initialIsOpen
        data-test-subj="indexConfigSettingsAccordion"
      >
        <EuiSpacer size="s" />
        <div data-test-subj="indexConfigSettingsEditor" css={css`height: 300px;`}>
          <CodeEditor
            languageId="json"
            value={settingsJSON}
            onChange={(val) => {
              setSettingsJSON(val);
              setSettingsDirty(true);
            }}
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
            }}
          />
        </div>
        {!isSettingsValid && settingsJSON.length > 0 && (
          <>
            <EuiSpacer size="s" />
            <EuiCallOut
              data-test-subj="indexConfigSettingsInvalidJson"
              color="danger"
              size="s"
              title={i18n.translate(
                'xpack.searchPlayground.relevance.indexConfig.invalidSettingsJson',
                { defaultMessage: 'Invalid JSON in settings' }
              )}
            />
          </>
        )}
        <EuiSpacer size="s" />
        <EuiButton
          data-test-subj="indexConfigSaveSettingsButton"
          size="s"
          onClick={handleSaveSettings}
          isLoading={isSavingSettings}
          disabled={!isSettingsValid || !settingsDirty}
        >
          <FormattedMessage
            id="xpack.searchPlayground.relevance.indexConfig.saveSettings"
            defaultMessage="Save Settings"
          />
        </EuiButton>
      </EuiAccordion>

      <EuiSpacer size="l" />

      <EuiAccordion
        id="index-mappings-accordion"
        buttonContent={i18n.translate(
          'xpack.searchPlayground.relevance.indexConfig.mappingsAccordion',
          { defaultMessage: 'Mappings' }
        )}
        initialIsOpen
        data-test-subj="indexConfigMappingsAccordion"
      >
        <EuiSpacer size="s" />
        <div data-test-subj="indexConfigMappingsEditor" css={css`height: 300px;`}>
          <CodeEditor
            languageId="json"
            value={mappingsJSON}
            onChange={(val) => {
              setMappingsJSON(val);
              setMappingsDirty(true);
            }}
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
            }}
          />
        </div>
        {!isMappingsValid && mappingsJSON.length > 0 && (
          <>
            <EuiSpacer size="s" />
            <EuiCallOut
              data-test-subj="indexConfigMappingsInvalidJson"
              color="danger"
              size="s"
              title={i18n.translate(
                'xpack.searchPlayground.relevance.indexConfig.invalidMappingsJson',
                { defaultMessage: 'Invalid JSON in mappings' }
              )}
            />
          </>
        )}
        <EuiSpacer size="s" />
        <EuiButton
          data-test-subj="indexConfigSaveMappingsButton"
          size="s"
          onClick={handleSaveMappings}
          isLoading={isSavingMappings}
          disabled={!isMappingsValid || !mappingsDirty}
        >
          <FormattedMessage
            id="xpack.searchPlayground.relevance.indexConfig.saveMappings"
            defaultMessage="Save Mappings"
          />
        </EuiButton>
      </EuiAccordion>

      <EuiSpacer size="l" />

      <EuiAccordion
        id="ingest-pipelines-accordion"
        buttonContent={i18n.translate(
          'xpack.searchPlayground.relevance.indexConfig.pipelinesAccordion',
          { defaultMessage: 'Ingest Pipelines' }
        )}
        initialIsOpen={false}
        data-test-subj="indexConfigPipelinesAccordion"
      >
        <EuiSpacer size="s" />
        <EuiSelect
          data-test-subj="indexConfigPipelineSelect"
          options={pipelineOptions}
          value={selectedPipelineId}
          onChange={(e) => handlePipelineChange(e.target.value)}
          fullWidth
        />
        {selectedPipelineId && (
          <>
            <EuiSpacer size="s" />
            <div data-test-subj="indexConfigPipelineEditor" css={css`height: 300px;`}>
              <CodeEditor
                languageId="json"
                value={pipelineJSON}
                onChange={(val) => {
                  setPipelineJSON(val);
                  setPipelineDirty(true);
                }}
                options={{
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
              />
            </div>
            {!isPipelineValid && pipelineJSON.length > 0 && (
              <>
                <EuiSpacer size="s" />
                <EuiCallOut
                  data-test-subj="indexConfigPipelineInvalidJson"
                  color="danger"
                  size="s"
                  title={i18n.translate(
                    'xpack.searchPlayground.relevance.indexConfig.invalidPipelineJson',
                    { defaultMessage: 'Invalid JSON in pipeline' }
                  )}
                />
              </>
            )}
            <EuiSpacer size="s" />
            <EuiButton
              data-test-subj="indexConfigSavePipelineButton"
              size="s"
              onClick={handleSavePipeline}
              isLoading={isSavingPipeline}
              disabled={!isPipelineValid || !pipelineDirty}
            >
              <FormattedMessage
                id="xpack.searchPlayground.relevance.indexConfig.savePipeline"
                defaultMessage="Save Pipeline"
              />
            </EuiButton>
          </>
        )}
      </EuiAccordion>
    </EuiPanel>
  );
};
