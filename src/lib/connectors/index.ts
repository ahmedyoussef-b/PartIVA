import { localDbConnector } from './local-db';
import type { SourceConnector } from './types';

import { fapiConnector } from './fapi';
import { isFapiConfigured } from './fapi';
import { dynamicConnectors } from './registry';

export const REAL_CONNECTORS: SourceConnector[] = [
  localDbConnector,
  ...(isFapiConfigured() ? [fapiConnector] : []),
  ...dynamicConnectors,
];

export const MOCK_CONNECTORS: SourceConnector[] = [];

export const ALL_CONNECTORS: SourceConnector[] =
  process.env.ENABLE_MOCK_CONNECTORS === 'true'
    ? [...REAL_CONNECTORS, ...MOCK_CONNECTORS]
    : [...REAL_CONNECTORS];
