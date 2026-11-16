// Types du formulaire intelligent PCB — 7 blocs
// Isolé du reste de l'application (namespace pcb/)

export type RequirementStatus = 'confirmed' | 'proposed' | 'to_verify' | 'missing';

export interface RequirementAnswer {
  blockId: string;
  questionId: string;
  answer: string;
  status: RequirementStatus;
}

export interface RequirementBlock {
  id: string;
  title: string;
  description: string;
  questions: RequirementQuestion[];
}

export interface RequirementQuestion {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'checkbox';
  options?: string[];
  required: boolean;
  condition?: (answers: RequirementAnswer[]) => boolean;
  suggestion?: string;
}

export interface RequirementFormState {
  answers: RequirementAnswer[];
  currentBlock: number;
  isComplete: boolean;
  incoherences: string[];
}
