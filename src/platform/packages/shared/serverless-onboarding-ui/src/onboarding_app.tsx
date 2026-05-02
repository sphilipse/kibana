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
import { TutorialsPage } from './tutorials/tutorials_page';

/**
 * Renders the full onboarding experience: a deployment dashboard at `/` and a
 * 3-step wizard at `/onboarding` (path choice → ingest → search). On first
 * load the dashboard auto-redirects to the wizard once; on subsequent loads
 * it stays put.
 */
export const OnboardingApp: React.FC = () => (
  <Routes>
    <Route exact path="/" component={HomePage} />
    <Route exact path="/onboarding" component={PathStep} />
    <Route exact path="/onboarding/ingest" component={IngestStep} />
    <Route exact path="/onboarding/search" component={SearchStep} />
    <Route exact path="/tutorials" component={TutorialsPage} />
    <Route render={() => <Redirect to="/" />} />
  </Routes>
);
