/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { setMockValues, setMockActions } from '../../../../__mocks__/kea_logic';

import React from 'react';

import { shallow } from 'enzyme';

import { EuiFilePicker } from '@elastic/eui';

import { rerender } from '../../../../test_helpers';

import { UploadFile } from './upload_file';

describe('UploadJsonFile', () => {
  const mockFile = new File(['mock'], 'mock.json', { type: 'application/json' });
  const values = {
    fileInput: null,
    isUploading: false,
    errors: [],
    configuredLimits: {
      engine: {
        maxDocumentByteSize: 102400,
      },
    },
  };
  const actions = {
    setFileInput: jest.fn(),
    onSubmitFile: jest.fn(),
    closeDocumentCreation: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setMockValues(values);
    setMockActions(actions);
  });

  describe('UploadJsonFileTabContent', () => {
    it('updates fileInput when files are added & removed', () => {
      const wrapper = shallow(<UploadFile />);

      wrapper.find(EuiFilePicker).simulate('change', [mockFile]);
      expect(actions.setFileInput).toHaveBeenCalledWith(mockFile);

      wrapper.find(EuiFilePicker).simulate('change', []);
      expect(actions.setFileInput).toHaveBeenCalledWith(null);
    });

    it('sets isLoading based on isUploading', () => {
      const wrapper = shallow(<UploadFile />);
      expect(wrapper.find(EuiFilePicker).prop('isLoading')).toBe(false);

      setMockValues({ ...values, isUploading: true });
      rerender(wrapper);
      expect(wrapper.find(EuiFilePicker).prop('isLoading')).toBe(true);
    });
  });
});
