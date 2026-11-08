import type { SourceConnector } from '../types';
import type { ConnectorDescriptor } from './types';
import { createHttpConnector } from './http-adapter';
import { stepPartsDescriptor } from './descriptors/step-parts';
import { cadenasDescriptor } from './descriptors/cadenas';

const DESCRIPTORS: ConnectorDescriptor[] = [stepPartsDescriptor, cadenasDescriptor];

export const dynamicConnectors: SourceConnector[] = DESCRIPTORS.filter(
  (d) => d.mode !== 'mock',
).map(createHttpConnector);
