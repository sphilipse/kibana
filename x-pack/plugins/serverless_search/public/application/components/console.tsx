/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { MainConsole } from '@kbn/console-plugin/public';

import React, { useEffect, useState } from 'react';
import {
  EuiPortal,
  EuiPanel,
  keys,
  EuiWindowEvent,
  useEuiTheme,
  euiCanAnimate,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { css, keyframes } from '@emotion/react';

const consoleAppear = keyframes`
  0% {
    transform: translateY(100%);
    opacity: 0;
  }

  100% {
    transform: translateY(0%);
    opacity: 1;
  }
`;

export const Console: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  /**
   * ESC key closes CustomFlyout
   */
  const onKeyDown = (event: any) => {
    if (event.key === keys.ESCAPE) {
      event.preventDefault();
      event.stopPropagation();
      setIsOpen(false);
    }
  };

  const [paddingLeft, setPaddingLeft] = useState('0px');

  const { euiTheme } = useEuiTheme();
  const minHeight = euiTheme.size.m;
  const maxHeight = '500px';
  const [height, setHeight] = useState(minHeight);

  useEffect(() => {
    setHeight(isOpen ? maxHeight : minHeight);
  }, [isOpen, minHeight, maxHeight]);

  const observer = new MutationObserver((el) => {
    setPaddingLeft((el[0].target as HTMLElement).style.paddingLeft);
  });
  observer.observe(document.body, { attributeFilter: ['style'] });

  useEffect(() => {
    document.body.style.paddingBottom = height;

    return () => {
      document.body.style.paddingBottom = '0px';
    };
  }, [isOpen, height]);
  return (
    <div>
      <EuiWindowEvent event="keydown" handler={onKeyDown} />
      <EuiPortal>
        <EuiPanel
          hasBorder
          aria-labelledby={'TODO'}
          role="dialog"
          paddingSize="l"
          css={css`
            position: fixed;
            bottom: 0;
            right: 0;
            left: ${paddingLeft};
            height: ${height};
            ${euiCanAnimate} {
              animation: ${consoleAppear} ${euiTheme.animation.slow}
                ${euiTheme.animation.resistance};
            }
            z-index: ${Number(euiTheme.levels.header) + 2};
            padding: ${euiTheme.size.l};
            padding-top: ${euiTheme.size.s};
          `}
        >
          <EuiFlexGroup alignItems="center" justifyContent="center">
            <EuiFlexItem grow={false}>
              {isOpen && <EuiButtonIcon iconType="arrowDown" onClick={() => setIsOpen(false)} />}
              {!isOpen && <EuiButtonIcon iconType="arrowUp" onClick={() => setIsOpen(true)} />}
            </EuiFlexItem>
          </EuiFlexGroup>
          <MainConsole
            settings={{
              fontSize: 14,
              polling: true,
              pollInterval: 60000,
              tripleQuotes: true,
              wrapMode: true,
              autocomplete: Object.freeze({
                fields: true,
                indices: true,
                templates: true,
                dataStreams: true,
              }),
              isHistoryEnabled: true,
              isKeyboardShortcutsEnabled: true,
              isAccessibilityOverlayEnabled: true,
            }}
          />
        </EuiPanel>
      </EuiPortal>
    </div>
  );
};
