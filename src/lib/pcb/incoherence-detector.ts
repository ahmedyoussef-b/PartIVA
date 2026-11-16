import type { RequirementAnswer } from './types';

// Détection d'incohérences basiques (règles + LLM en 7-c)
export function detectIncoherences(answers: RequirementAnswer[]): string[] {
  const incoherences: string[] = [];
  const get = (id: string) => answers.find((a) => a.questionId === id)?.answer;

  const power = get('power');
  const inputs = get('inputs');
  const communications = get('communications');

  if (power && inputs && inputs.includes('capteur') && power.includes('3.3')) {
    incoherences.push(
      'Capteur déclaré avec alimentation 3.3V — vérifier la compatibilité (level shifter ?)',
    );
  }

  if (communications && communications.includes('WiFi') && !get('consumption')) {
    incoherences.push(
      'WiFi sélectionné mais consommation non renseignée — critique pour le choix du MCU',
    );
  }

  const usage = get('usage_type');
  const temp = get('temp_range');
  if (usage === 'industriel' && temp && !temp.includes('-40')) {
    incoherences.push('Usage industriel mais plage de température non étendue (-40°C recommandé)');
  }

  return incoherences;
}
