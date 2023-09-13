/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { renderConsoleApp } from '@kbn/console-plugin/public';
import { BootDependencies } from '@kbn/console-plugin/public/application';
import React, { useEffect, useMemo } from 'react';

export const Console: React.FC<{ dependencies: BootDependencies }> = ({ dependencies }) => {
  const el: HTMLElement = useMemo(() => document.createElement('div'), []);

  useEffect(() => {
    let body = document.querySelector('body');
    if (body && el) {
      body.appendChild(el);
    }
    return () => {
      body = document.querySelector('body');
      if (body && el) {
        body.removeChild(el);
      }
    };
  }, [el]);

  if (!el) {
    return null;
  }
  const element = el; // dependencies.element.querySelector('#dev_console') as HTMLElement;
  // console.log(dependencies.element);
  // console.log(element);
  return <>{renderConsoleApp({ ...dependencies, element })}</>;
};
