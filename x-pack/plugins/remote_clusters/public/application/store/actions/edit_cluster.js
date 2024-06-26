/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';

import { toasts, fatalError } from '../../services/notification';
import { loadClusters } from './load_clusters';

import { extractQueryParams } from '../../../shared_imports';
import { editCluster as sendEditClusterRequest, getRouter, redirect } from '../../services';

import {
  EDIT_CLUSTER_START,
  EDIT_CLUSTER_STOP,
  EDIT_CLUSTER_SAVE,
  EDIT_CLUSTER_SUCCESS,
  EDIT_CLUSTER_FAILURE,
  CLEAR_EDIT_CLUSTER_ERRORS,
} from '../action_types';

export const editCluster = (cluster) => async (dispatch) => {
  dispatch({
    type: EDIT_CLUSTER_SAVE,
  });

  try {
    await Promise.all([
      sendEditClusterRequest(cluster),
      // Wait at least half a second to avoid a weird flicker of the saving feedback.
      new Promise((resolve) => setTimeout(resolve, 500)),
    ]);
  } catch (error) {
    if (error) {
      const { body } = error;

      // Expect an error in the shape provided by http service.
      if (body) {
        const { statusCode, message } = body;
        return dispatch({
          type: EDIT_CLUSTER_FAILURE,
          payload: {
            error: {
              message: i18n.translate('xpack.remoteClusters.editAction.failedDefaultErrorMessage', {
                defaultMessage: 'Request failed with a {statusCode} error. {message}',
                values: { statusCode, message },
              }),
            },
          },
        });
      }
    }

    // This error isn't an HTTP error, so let the fatal error screen tell the user something
    // unexpected happened.
    return fatalError.add(
      error,
      i18n.translate('xpack.remoteClusters.editAction.errorTitle', {
        defaultMessage: 'Error editing cluster',
      })
    );
  }

  dispatch({
    type: EDIT_CLUSTER_SUCCESS,
  });

  const {
    history,
    route: {
      location: { search },
    },
  } = getRouter();
  const { redirect: redirectUrl } = extractQueryParams(search);

  if (redirectUrl) {
    // A toast is only needed if we're leaving the app.
    toasts.addSuccess(
      i18n.translate('xpack.remoteClusters.editAction.successTitle', {
        defaultMessage: `Edited remote cluster ''{name}''`,
        values: { name: cluster.name },
      })
    );

    const decodedRedirect = decodeURIComponent(redirectUrl);
    redirect(`${decodedRedirect}?cluster=${cluster.name}`);
  } else {
    // This will open the edited cluster in the detail panel. Note that we're *not* showing a success toast
    // here, because it would partially obscure the detail panel.
    history.push({
      pathname: `/list`,
      search: `?cluster=${cluster.name}`,
    });
  }
};

export const startEditingCluster =
  ({ clusterName }) =>
  (dispatch) => {
    dispatch(loadClusters());

    dispatch({
      type: EDIT_CLUSTER_START,
      payload: { clusterName },
    });
  };

export const stopEditingCluster = () => (dispatch) => {
  // Load the clusters to refresh the one we just edited.
  dispatch(loadClusters());

  dispatch({
    type: EDIT_CLUSTER_STOP,
  });
};

export const clearEditClusterErrors = () => (dispatch) => {
  dispatch({
    type: CLEAR_EDIT_CLUSTER_ERRORS,
  });
};
