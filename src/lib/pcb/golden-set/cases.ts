// V35.1 — Golden set : 10 cahiers des charges types (entrées) + attentes (sorties).
// Les `componentKinds` sont un sous-ensemble des 6 catégories produites par
// l'analyse (usage / function / processing / mechanical / manufacturing / quality).

export interface GoldenCase {
  id: string;
  title: string;
  cdc: string;
  expected: {
    boardWidthMm?: number;
    boardHeightMm?: number;
    dimensionTolerancePct?: number;
    componentKinds: string[];
    mustMention?: string[];
  };
}

export const GOLDEN_CASES: GoldenCase[] = [
  {
    id: 'golden-01-alim-5v-3v3',
    title: 'Alimentation linéaire 5V → 3,3V (500 mA)',
    cdc: "Je dois concevoir une carte d'alimentation qui convertit le 5 V d'un adaptateur secteur en 3,3 V régulé pour alimenter un capteur. Courant de sortie 500 mA, ondulation maximale 50 mV. Entrée sur connecteur USB-A, sortie sur 2 broches soudées. Encombrement réduit, moins de 50 x 30 mm.",
    expected: {
      boardWidthMm: 50,
      boardHeightMm: 30,
      dimensionTolerancePct: 15,
      componentKinds: ['usage', 'function', 'processing', 'mechanical', 'manufacturing'],
      mustMention: ['3.3', '500'],
    },
  },
  {
    id: 'golden-02-driver-led-12v',
    title: 'Driver LED 12 V, 8 canaux (PWM)',
    cdc: 'Carte de commande pour 8 rubans de LED 12 V, gradation PWM par canal, courant 350 mA par canal. Entrée 12 V sur bornier, sorties sur connecteurs JST. Boîtier plastique, dimensions 120 x 80 mm, fixation par 4 vis M3.',
    expected: {
      boardWidthMm: 120,
      boardHeightMm: 80,
      componentKinds: ['usage', 'function', 'processing', 'mechanical', 'manufacturing'],
      mustMention: ['12', 'PWM'],
    },
  },
  {
    id: 'golden-03-capteur-i2c-qwiic',
    title: 'Capteur I2C température/humidité + connecteur Qwiic',
    cdc: "Porte-carte pour un capteur de température et d'humidité I2C (type SHT31), avec connecteur Qwiic / Stemma. Alimentation 3,3 V, adresse I2C configurable par strap. Format compact 25 x 25 mm, deux trous de fixation M2.5.",
    expected: {
      boardWidthMm: 25,
      boardHeightMm: 25,
      componentKinds: ['usage', 'function', 'mechanical'],
      mustMention: ['I2C', '3.3'],
    },
  },
  {
    id: 'golden-04-driver-pas-a-pas',
    title: 'Driver moteur pas-à-pas (A4988) + bornier',
    cdc: "Carte driver pour moteur pas-à-pas bipolaire avec A4988, alimentation moteur 12 V, logique 5 V. Bornier 4 broches pour le moteur, connecteur d'alimentation Molex. Dissipation par dissipateur thermique, dimensions 60 x 40 mm.",
    expected: {
      boardWidthMm: 60,
      boardHeightMm: 40,
      componentKinds: ['usage', 'function', 'processing', 'mechanical', 'manufacturing'],
      mustMention: ['12', 'A4988'],
    },
  },
  {
    id: 'golden-05-ampli-classe-d',
    title: 'Amplificateur audio classe D 2×3 W',
    cdc: 'Amplificateur stéréo classe D 2 x 3 W sur haut-parleurs 4 ohms, alimentation 5 V. Entrées audio sur Jack 3,5 mm stéréo, sorties sur borniers. Faible THD, format 70 x 50 mm.',
    expected: {
      boardWidthMm: 70,
      boardHeightMm: 50,
      componentKinds: ['usage', 'function', 'processing', 'mechanical', 'manufacturing'],
      mustMention: ['4', '5'],
    },
  },
  {
    id: 'golden-06-mcu-stm32-usbc',
    title: 'Carte MCU minimale (STM32) + USB-C + SWD',
    cdc: "Carte mère minimale autour d'un STM32F103, alimentation USB-C 5 V, régulateur 3,3 V intégré, connecteur SWD 4 broches, bouton reset et LED d'état. Dimensions 40 x 25 mm, 4 trous de fixation M2.",
    expected: {
      boardWidthMm: 40,
      boardHeightMm: 25,
      componentKinds: ['usage', 'function', 'processing', 'mechanical', 'manufacturing'],
      mustMention: ['STM32', 'SWD'],
    },
  },
  {
    id: 'golden-07-chargeur-lipo',
    title: 'Chargeur LiPo USB-C + protection',
    cdc: 'Module de charge pour batterie LiPo 1S avec entrée USB-C 5 V, courant de charge 1 A, protection contre les courts-circuits et la surcharge, connecteur JST 2 broches. Dimensions 30 x 20 mm.',
    expected: {
      boardWidthMm: 30,
      boardHeightMm: 20,
      componentKinds: ['usage', 'function', 'processing', 'mechanical'],
      mustMention: ['1S', 'USB'],
    },
  },
  {
    id: 'golden-08-relais-4c-230v',
    title: 'Relais 4 canaux 230 V (isolation opto)',
    cdc: 'Carte 4 relais pour pilotage de charges 230 V, isolation galvanique par optocoupleurs, entrée logique 5 V, relais 10 A. Borniers de puissance, dimensions 100 x 70 mm, barrière de séparation physique entre puissance et commande.',
    expected: {
      boardWidthMm: 100,
      boardHeightMm: 70,
      componentKinds: ['usage', 'function', 'processing', 'mechanical', 'manufacturing'],
      mustMention: ['230', 'opto'],
    },
  },
  {
    id: 'golden-09-capteur-rs485',
    title: 'Capteur RS485 avec transceiver + protection ESD',
    cdc: 'Carte capteur RS485 avec transceiver half-duplex, isolation galvanique, protection ESD sur le bus, connecteur RJ45 ou bornier 3 broches. Alimentation 24 V, consommation faible, format 45 x 30 mm.',
    expected: {
      boardWidthMm: 45,
      boardHeightMm: 30,
      componentKinds: ['usage', 'function', 'processing', 'mechanical', 'manufacturing'],
      mustMention: ['RS485', 'ESD'],
    },
  },
  {
    id: 'golden-10-carte-mixte',
    title: 'Carte mixte : MCU + capteur analogique + régulateur + connecteur',
    cdc: "Carte de conditionnement pour un capteur analogique 0-10 V : MCU low-power, échantillonnage 12 bits, régulateur 3,3 V, sortie I2C, connecteur d'entrée 4 broches. Dimensions 55 x 40 mm, consommation inférieure à 50 mA.",
    expected: {
      boardWidthMm: 55,
      boardHeightMm: 40,
      componentKinds: ['usage', 'function', 'processing', 'mechanical', 'manufacturing'],
      mustMention: ['0-10', 'I2C'],
    },
  },
];
