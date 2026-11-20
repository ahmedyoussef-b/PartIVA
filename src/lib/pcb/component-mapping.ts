export type ResolvedComponent = {
  symbolId: string;
  refPrefix: string;
  label: string;
};

type MappingEntry = ResolvedComponent & { aliases: string[] };

const MAPPINGS: MappingEntry[] = [
  {
    symbolId: 'resistor',
    refPrefix: 'R',
    label: 'Résistance',
    aliases: ['resistance', 'resistor', 'resistances', 'r'],
  },
  {
    symbolId: 'capacitor',
    refPrefix: 'C',
    label: 'Condensateur',
    aliases: ['condensateur', 'condensateurs', 'capacitor', 'cap', 'c'],
  },
  {
    symbolId: 'led',
    refPrefix: 'LED',
    label: 'LED',
    aliases: ['led', 'leds', 'del', 'diode electroluminescente'],
  },
  {
    symbolId: 'transistor',
    refPrefix: 'Q',
    label: 'Transistor',
    aliases: ['transistor', 'transistors', 'q'],
  },
  {
    symbolId: 'diode',
    refPrefix: 'D',
    label: 'Diode',
    aliases: ['diode', 'diodes', 'd'],
  },
  {
    symbolId: 'inductor',
    refPrefix: 'L',
    label: 'Inductance',
    aliases: ['inductance', 'inductances', 'bobine', 'inductor', 'l'],
  },
  {
    symbolId: 'connector',
    refPrefix: 'J',
    label: 'Connecteur',
    aliases: ['connecteur', 'connecteurs', 'connector', 'header', 'j'],
  },
  {
    symbolId: 'power',
    refPrefix: 'V',
    label: 'Alimentation',
    aliases: ['alimentation', 'power', 'vcc', 'v'],
  },
];

function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function resolveComponentFromText(input: string): ResolvedComponent | null {
  const normalized = normalize(input);
  if (!normalized) return null;

  for (const entry of MAPPINGS) {
    if (entry.aliases.includes(normalized)) {
      return { symbolId: entry.symbolId, refPrefix: entry.refPrefix, label: entry.label };
    }
  }
  return null;
}
