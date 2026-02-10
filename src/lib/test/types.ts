export type Question = {
  index: number;
  description: string;
  group: string;
  type: string;
  currentItemIndex: number | null;
  currentValue: number | null;
  answers: Answer[];
};

export type Answer = {
  index: number;
  value: number;
  answer: string;
};

export type GroupedResult = { group: string; sum: number };

export type CutOff = {
  index: number;
  end: number;
  result: string;
  description: string;
  severityColor: string;
};

export type Group = {
  id: string;
  title: string;
  description: string;
  cutOffs: CutOff[];
};

export type Questionnaire = {
  id: number;
  name: string;
  image: string;
  title: string;
  description: string;
  instruction: string;
  version: number;
  date: Date;
  questions: Question[];
  groups: Group[];
  relatedArticles: string[];
  relatedTests: string[];
};
