import { localDbConnector } from './local-db';
import { wikidataConnector } from './wikidata';
import { industrialCatalogConnector } from './industrial-catalog';
import type { SourceConnector } from './types';

import { fapiConnector } from './fapi';
import { isFapiConfigured } from './fapi';
import { dynamicConnectors } from './registry';

export const REAL_CONNECTORS: SourceConnector[] = [
  localDbConnector,
  wikidataConnector,
  industrialCatalogConnector,
  ...(isFapiConfigured() ? [fapiConnector] : []),
  ...dynamicConnectors,
];

export const MOCK_CONNECTORS: SourceConnector[] = [
  // tracePartsConnector, tecdocConnector, threeDCarPartsConnector retirés
  // (passage à l'architecture dynamique)
];

export const ALL_CONNECTORS: SourceConnector[] =
  process.env.ENABLE_MOCK_CONNECTORS === 'true'
    ? [...REAL_CONNECTORS, ...MOCK_CONNECTORS]
    : [...REAL_CONNECTORS];
