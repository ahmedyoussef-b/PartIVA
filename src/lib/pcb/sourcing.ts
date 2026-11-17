// Sourcing BOM — recherche composants, coût, alternatives
// V1 : base mock (LCSC/JLCPCB). V2 : API réelle.

export interface SourcingComponent {
  id: string;
  name: string;
  category: string;
  supplier: string;
  supplierRef: string;
  price: number;
  currency: string;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  moq: number;
}

export interface BomCost {
  total: number;
  currency: string;
  components: Array<{ name: string; price: number; quantity: number; subtotal: number }>;
  missing: string[];
}

// Base mock — 10 composants courants
const MOCK_CATALOG: SourcingComponent[] = [
  {
    id: 'r-10k-0603',
    name: 'Résistance 10kΩ 0603',
    category: 'resistor',
    supplier: 'LCSC',
    supplierRef: 'C25804',
    price: 0.01,
    currency: 'EUR',
    stockStatus: 'in_stock',
    moq: 100,
  },
  {
    id: 'c-100n-0603',
    name: 'Condensateur 100nF 0603',
    category: 'capacitor',
    supplier: 'LCSC',
    supplierRef: 'C14663',
    price: 0.02,
    currency: 'EUR',
    stockStatus: 'in_stock',
    moq: 100,
  },
  {
    id: 'c-10u-0805',
    name: 'Condensateur 10µF 0805',
    category: 'capacitor',
    supplier: 'LCSC',
    supplierRef: 'C15850',
    price: 0.05,
    currency: 'EUR',
    stockStatus: 'in_stock',
    moq: 50,
  },
  {
    id: 'led-red-0603',
    name: 'LED rouge 0603',
    category: 'led',
    supplier: 'LCSC',
    supplierRef: 'C2286',
    price: 0.03,
    currency: 'EUR',
    stockStatus: 'in_stock',
    moq: 100,
  },
  {
    id: 'mcu-stm32f103',
    name: 'STM32F103C8T6',
    category: 'mcu',
    supplier: 'LCSC',
    supplierRef: 'C8734',
    price: 1.8,
    currency: 'EUR',
    stockStatus: 'in_stock',
    moq: 1,
  },
  {
    id: 'reg-ams1117-33',
    name: 'AMS1117-3.3',
    category: 'regulator',
    supplier: 'LCSC',
    supplierRef: 'C6186',
    price: 0.1,
    currency: 'EUR',
    stockStatus: 'in_stock',
    moq: 10,
  },
  {
    id: 'conn-usb-c',
    name: 'Connecteur USB-C',
    category: 'connector',
    supplier: 'LCSC',
    supplierRef: 'C165948',
    price: 0.25,
    currency: 'EUR',
    stockStatus: 'in_stock',
    moq: 10,
  },
  {
    id: 'xtal-8mhz',
    name: 'Quartz 8MHz',
    category: 'crystal',
    supplier: 'LCSC',
    supplierRef: 'C115962',
    price: 0.15,
    currency: 'EUR',
    stockStatus: 'in_stock',
    moq: 10,
  },
  {
    id: 'btn-tact',
    name: 'Bouton tactile 6x6',
    category: 'button',
    supplier: 'LCSC',
    supplierRef: 'C221909',
    price: 0.08,
    currency: 'EUR',
    stockStatus: 'in_stock',
    moq: 20,
  },
  {
    id: 'lcd-16x2',
    name: 'Écran LCD 16x2',
    category: 'display',
    supplier: 'LCSC',
    supplierRef: 'C27151',
    price: 1.5,
    currency: 'EUR',
    stockStatus: 'low_stock',
    moq: 1,
  },
];

export function searchComponents(query: string): SourcingComponent[] {
  const q = query.toLowerCase();
  return MOCK_CATALOG.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.supplierRef.toLowerCase().includes(q),
  );
}

export function getBomCost(components: Array<{ name: string; quantity: number }>): BomCost {
  let total = 0;
  const items: BomCost['components'] = [];
  const missing: string[] = [];

  for (const comp of components) {
    const found = MOCK_CATALOG.find(
      (c) => c.name.toLowerCase() === comp.name.toLowerCase() || c.id === comp.name,
    );
    if (!found) {
      missing.push(comp.name);
      continue;
    }
    const subtotal = found.price * comp.quantity;
    total += subtotal;
    items.push({ name: found.name, price: found.price, quantity: comp.quantity, subtotal });
  }

  return { total, currency: 'EUR', components: items, missing };
}

export function findAlternatives(componentId: string): SourcingComponent[] {
  const base = MOCK_CATALOG.find((c) => c.id === componentId);
  if (!base) return [];
  return MOCK_CATALOG.filter((c) => c.category === base.category && c.id !== base.id);
}
