export const REQUIRED_SPEC_KEYS = [
  'diameter_ext',
  'diameter_int',
  'width',
  'weight',
  'module',
  'teeth',
  'bore',
  'contact_angle',
] as const;

export type RequiredSpecKey = (typeof REQUIRED_SPEC_KEYS)[number];
