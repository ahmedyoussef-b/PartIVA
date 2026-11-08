import type { SourceConnector } from '../types';
import type { ConnectorDescriptor } from './types';
import { createHttpConnector } from './http-adapter';
import { stepPartsDescriptor } from './descriptors/step-parts';
import { cadenasDescriptor } from './descriptors/cadenas';
import { wikidataDescriptor } from './descriptors/wikidata';
import { openserpDescriptor } from './descriptors/openserp';

const DESCRIPTORS: ConnectorDescriptor[] = [
  stepPartsDescriptor,
  cadenasDescriptor,
  wikidataDescriptor,
  openserpDescriptor,
];

export const dynamicConnectors: SourceConnector[] = DESCRIPTORS.filter(
  (d) => d.mode !== 'mock',
).map(createHttpConnector);
