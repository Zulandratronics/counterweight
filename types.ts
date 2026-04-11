
export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Fallacy {
  name: string;
  description: string;
  excerpt: string;
}

export interface FactCheck {
  claim: string;
  verdict: 'True' | 'False' | 'Misleading' | 'Unverifiable';
  explanation: string;
}

export interface AnalysisResult {
  fallacies: Fallacy[];
  inconsistencies: string[];
  factChecks: FactCheck[];
  counterArgument: string;
  logicScore: number; // 0-100
  sources: GroundingSource[];
  rawResponse: string;
}

export interface ChartData {
  subject: string;
  value: number;
  fullMark: number;
}
