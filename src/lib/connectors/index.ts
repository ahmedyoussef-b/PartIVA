import { localDbConnector } from './local-db';
import { wikidataConnector } from './wikidata';
import { tracePartsConnector } from './traceparts';
import { tecDocConnector } from './tecdoc';
import { industrialCatalogConnector } from './industrial-catalog';
import { threeDCarPartsConnector } from './3dcarparts';
import type { SourceConnector } from './types';

export const REAL_CONNECTORS: SourceConnector[] = [
  localDbConnector,
  wikidataConnector,
  industrialCatalogConnector,
];

export const MOCK_CONNECTORS: SourceConnector[] = [
  tracePartsConnector,
  tecDocConnector,
  threeDCarPartsConnector,
];

export const ALL_CONNECTORS: SourceConnector[] =
  process.env.ENABLE_MOCK_CONNECTORS === 'true'
    ? [...REAL_CONNECTORS, ...MOCK_CONNECTORS]
    : [...REAL_CONNECTORS];
