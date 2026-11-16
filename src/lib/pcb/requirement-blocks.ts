import type { RequirementBlock } from './types';

export const requirementBlocks: RequirementBlock[] = [
  {
    id: 'usage',
    title: "Contexte d'usage et contraintes environnementales",
    description: 'Où et comment la carte va-t-elle vivre ?',
    questions: [
      {
        id: 'usage_type',
        label: 'Usage prévu',
        type: 'select',
        options: ['prototype', 'petite série', 'série', 'industriel', 'grand public'],
        required: true,
      },
      { id: 'temp_range', label: 'Température de fonctionnement', type: 'text', required: true },
      {
        id: 'environment',
        label: 'Environnement (vibrations, humidité, IP)',
        type: 'text',
        required: false,
      },
      { id: 'lifetime', label: 'Durée de vie attendue', type: 'text', required: false },
    ],
  },
  {
    id: 'functions',
    title: 'Fonctions principales et interfaces',
    description: 'Que doit faire la carte ?',
    questions: [
      { id: 'main_functions', label: 'Fonctions principales', type: 'text', required: true },
      {
        id: 'inputs',
        label: "Interfaces d'entrée",
        type: 'multiselect',
        options: ['capteur', 'bouton', 'connecteur', 'autre'],
        required: false,
      },
      {
        id: 'outputs',
        label: 'Interfaces de sortie',
        type: 'multiselect',
        options: ['écran', 'LED', 'relais', 'moteur', 'autre'],
        required: false,
      },
      {
        id: 'communications',
        label: 'Communications',
        type: 'multiselect',
        options: ['USB', 'UART', 'I2C', 'SPI', 'WiFi', 'BLE', 'CAN', 'autre'],
        required: false,
      },
      {
        id: 'power',
        label: 'Alimentation disponible (tension, courant, source)',
        type: 'text',
        required: true,
      },
    ],
  },
  {
    id: 'processing',
    title: 'Traitement et intelligence',
    description: 'Quel est le "cerveau" de la carte ?',
    questions: [
      {
        id: 'complexity',
        label: 'Complexité du traitement',
        type: 'select',
        options: ['logique simple', 'microcontrôleur', 'SoC', 'FPGA'],
        required: true,
      },
      { id: 'realtime', label: 'Contraintes temps réel', type: 'checkbox', required: false },
      { id: 'memory', label: 'Mémoire nécessaire (flash, RAM)', type: 'text', required: false },
      {
        id: 'consumption',
        label: 'Consommation cible (veille, actif)',
        type: 'text',
        required: false,
      },
    ],
  },
  {
    id: 'mechanical',
    title: 'Contraintes mécaniques et physiques',
    description: 'Quelles sont les contraintes de forme ?',
    questions: [
      {
        id: 'dimensions',
        label: 'Dimensions max de la carte (L × l × H)',
        type: 'text',
        required: true,
      },
      { id: 'mounting', label: 'Fixation (vis, clips, connecteur)', type: 'text', required: false },
      {
        id: 'connector_position',
        label: 'Position des connecteurs',
        type: 'text',
        required: false,
      },
      { id: 'aesthetics', label: 'Contraintes esthétiques', type: 'text', required: false },
    ],
  },
  {
    id: 'manufacturing',
    title: 'Contraintes de fabrication et de coût',
    description: 'Quel est le budget et le volume ?',
    questions: [
      { id: 'quantity', label: 'Quantité prévue', type: 'number', required: true },
      { id: 'budget', label: 'Budget approximatif par carte', type: 'text', required: true },
      {
        id: 'manufacturer',
        label: 'Contraintes de fabrication',
        type: 'select',
        options: ['JLCPCB', 'PCBWay', 'fabricant local', 'autre'],
        required: false,
      },
      { id: 'deadline', label: 'Délai souhaité', type: 'text', required: false },
    ],
  },
  {
    id: 'quality',
    title: 'Exigences de qualité et de test',
    description: 'Comment valider la carte ?',
    questions: [
      { id: 'tests', label: 'Tests fonctionnels prévus', type: 'text', required: false },
      { id: 'reliability', label: 'Exigences de fiabilité', type: 'text', required: false },
      {
        id: 'standards',
        label: 'Normes à respecter',
        type: 'multiselect',
        options: ['CE', 'FCC', 'RoHS', 'autre'],
        required: false,
      },
    ],
  },
  {
    id: 'summary',
    title: 'Récapitulatif et validation',
    description: 'Vérifiez vos réponses avant de valider.',
    questions: [], // Rendu par le composant Summary
  },
];

export function getBlockById(id: string): RequirementBlock | undefined {
  return requirementBlocks.find((b) => b.id === id);
}
