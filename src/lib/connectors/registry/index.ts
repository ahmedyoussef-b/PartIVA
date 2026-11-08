import type { SourceConnector } from '../types';
import type { ConnectorDescriptor } from './types';
import { createHttpConnector } from './http-adapter';
import { stepPartsDescriptor } from './descriptors/step-parts';

// Plus tard : import { autreDescriptor } from './descriptors/autre';

const DESCRIPTORS: ConnectorDescriptor[] = [
  stepPartsDescriptor,
  // Ajouter d'autres sources ici
];

export const dynamicConnectors: SourceConnector[] = DESCRIPTORS.filter(
  (d) => d.mode !== 'mock',
).map(createHttpConnector);
