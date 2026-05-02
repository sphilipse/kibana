/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { Redirect } from 'react-router-dom';
import { Route, Routes } from '@kbn/shared-ux-router';
import { HomePage } from './home/home_page';
import { IngestStep } from './onboarding/ingest_step';
import { PathStep } from './onboarding/path_step';
import { SearchStep } from './onboarding/search_step';

/**
 * Renders the full onboarding experience: a 3-step wizard (path choice,
 * ingest, search) at `/`, `/ingest`, `/search`, plus a deployment dashboard
 * at `/dashboard`. The hosting plugin is responsible for wrapping this in
 * a `<Router>` and providing the required Kibana services on context.
 */
export const OnboardingApp: React.FC = () => (
  <Routes>
    <Route exact path="/" component={PathStep} />
    <Route exact path="/ingest" component={IngestStep} />
    <Route exact path="/search" component={SearchStep} />
    <Route exact path="/dashboard" component={HomePage} />
    <Route render={() => <Redirect to="/" />} />
  </Routes>
);
