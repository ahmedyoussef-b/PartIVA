import * as React from 'react';

export type ComponentSymbol = {
  id: string;
  label: string;
  refPrefix: string;
  footprint: string;
  render: (props: { size: number; color: string }) => React.ReactNode;
};

const svgProps = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 40 40',
  xmlns: 'http://www.w3.org/2000/svg',
});

const resistor: ComponentSymbol = {
  id: 'resistor',
  label: 'Résistance',
  refPrefix: 'R',
  footprint: 'Resistor_SMD:R_0603_1608Metric',
  render: ({ size, color }) => (
    <svg {...svgProps(size)}>
      <path
        d="M4 20 H9 L12 12 L16 28 L20 12 L24 28 L28 12 L31 20 H36"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  ),
};

const capacitor: ComponentSymbol = {
  id: 'capacitor',
  label: 'Condensateur',
  refPrefix: 'C',
  footprint: 'Capacitor_SMD:C_0603_1608Metric',
  render: ({ size, color }) => (
    <svg {...svgProps(size)}>
      <line x1="4" y1="20" x2="15" y2="20" stroke={color} strokeWidth={2} />
      <line x1="15" y1="10" x2="15" y2="30" stroke={color} strokeWidth={2.5} />
      <line x1="25" y1="10" x2="25" y2="30" stroke={color} strokeWidth={2.5} />
      <line x1="25" y1="20" x2="36" y2="20" stroke={color} strokeWidth={2} />
    </svg>
  ),
};

const led: ComponentSymbol = {
  id: 'led',
  label: 'LED',
  refPrefix: 'LED',
  footprint: 'LED_SMD:LED_0603_1608Metric',
  render: ({ size, color }) => (
    <svg {...svgProps(size)}>
      <line x1="4" y1="22" x2="13" y2="22" stroke={color} strokeWidth={2} />
      <polygon points="13,13 13,31 27,22" fill="none" stroke={color} strokeWidth={2} />
      <line x1="27" y1="13" x2="27" y2="31" stroke={color} strokeWidth={2.5} />
      <line x1="27" y1="22" x2="36" y2="22" stroke={color} strokeWidth={2} />
      <line x1="18" y1="9" x2="24" y2="4" stroke={color} strokeWidth={1.5} />
      <line x1="22" y1="12" x2="28" y2="7" stroke={color} strokeWidth={1.5} />
    </svg>
  ),
};

const transistor: ComponentSymbol = {
  id: 'transistor',
  label: 'Transistor',
  refPrefix: 'Q',
  footprint: 'Package_TO_SOT_SMD:SOT-23',
  render: ({ size, color }) => (
    <svg {...svgProps(size)}>
      <circle cx="20" cy="20" r="13" fill="none" stroke={color} strokeWidth={1.5} />
      <line x1="14" y1="9" x2="14" y2="31" stroke={color} strokeWidth={2} />
      <line x1="14" y1="15" x2="28" y2="8" stroke={color} strokeWidth={2} />
      <line x1="14" y1="25" x2="28" y2="32" stroke={color} strokeWidth={2} />
      <polygon points="23,30 28,32 26,27" fill={color} />
    </svg>
  ),
};

const diode: ComponentSymbol = {
  id: 'diode',
  label: 'Diode',
  refPrefix: 'D',
  footprint: 'Diode_SMD:D_0603_1608Metric',
  render: ({ size, color }) => (
    <svg {...svgProps(size)}>
      <line x1="4" y1="20" x2="12" y2="20" stroke={color} strokeWidth={2} />
      <polygon points="12,11 12,29 27,20" fill="none" stroke={color} strokeWidth={2} />
      <line x1="27" y1="11" x2="27" y2="29" stroke={color} strokeWidth={2.5} />
      <line x1="27" y1="20" x2="36" y2="20" stroke={color} strokeWidth={2} />
    </svg>
  ),
};

const inductor: ComponentSymbol = {
  id: 'inductor',
  label: 'Inductance',
  refPrefix: 'L',
  footprint: 'Inductor_SMD:L_0603_1608Metric',
  render: ({ size, color }) => (
    <svg {...svgProps(size)}>
      <path
        d="M4 22 H8 A4 4 0 0 1 8 14 A4 4 0 0 1 8 22 A4 4 0 0 1 8 14 A4 4 0 0 1 8 22 A4 4 0 0 1 8 14 A4 4 0 0 1 8 22 H36"
        fill="none"
        stroke={color}
        strokeWidth={2}
      />
    </svg>
  ),
};

const connector: ComponentSymbol = {
  id: 'connector',
  label: 'Connecteur',
  refPrefix: 'J',
  footprint: 'Connector_PinHeader_2.54mm:PinHeader_1x04',
  render: ({ size, color }) => (
    <svg {...svgProps(size)}>
      <rect x="10" y="10" width="20" height="20" rx="2" fill="none" stroke={color} strokeWidth={2} />
      <line x1="16" y1="10" x2="16" y2="20" stroke={color} strokeWidth={1.5} />
      <line x1="24" y1="10" x2="24" y2="20" stroke={color} strokeWidth={1.5} />
      <line x1="16" y1="20" x2="16" y2="30" stroke={color} strokeWidth={1.5} />
      <line x1="24" y1="20" x2="24" y2="30" stroke={color} strokeWidth={1.5} />
    </svg>
  ),
};

const power: ComponentSymbol = {
  id: 'power',
  label: 'Alimentation',
  refPrefix: 'V',
  footprint: 'Connector:PinHeader_1x02',
  render: ({ size, color }) => (
    <svg {...svgProps(size)}>
      <circle cx="20" cy="20" r="13" fill="none" stroke={color} strokeWidth={2} />
      <line x1="14" y1="16" x2="22" y2="16" stroke={color} strokeWidth={2} />
      <line x1="18" y1="12" x2="18" y2="20" stroke={color} strokeWidth={2} />
      <line x1="24" y1="26" x2="30" y2="26" stroke={color} strokeWidth={2} />
    </svg>
  ),
};

export const COMPONENT_SYMBOLS: ComponentSymbol[] = [
  resistor,
  capacitor,
  led,
  transistor,
  diode,
  inductor,
  connector,
  power,
];

export const SYMBOLS_BY_ID: Record<string, ComponentSymbol> = Object.fromEntries(
  COMPONENT_SYMBOLS.map((s) => [s.id, s]),
);