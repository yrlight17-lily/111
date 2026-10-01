export type StepNumber = 1 | 2 | 3 | 4 | 5 | 6;

export type ColumnType = 'item' | 'current' | 'expected' | 'text' | 'ignore';

export interface SurveyColumnMapping {
  columnName: string;
  type: ColumnType;
  competencyName?: string; // If the column header itself is the question or item name
}

export interface SurveyData {
  fileName?: string;
  headers: string[];
  rows: Record<string, any>[];
  columnMapping: Record<string, ColumnType>;
  customItemLabels?: Record<string, string>; // Friendly names for column keys
}

export interface InterviewMemo {
  id: string;
  sourceRole: '학습자(현업)' | '현업 관리자(팀장/임원)' | '경영진' | '인사/HRD 담당자' | '기타 실무자';
  intervieweeName?: string;
  date: string;
  content: string;
}

export interface ReferenceDoc {
  id: string;
  title: string;
  category: '직무기술서' | '역량모델' | '과정 만족도 결과' | '조직진단/성과지표' | '기타';
  content: string;
  updatedAt?: string;
}

export interface QuantitativeItem {
  id: string;
  itemName: string;
  currentMean: number;
  expectedMean: number;
  gap: number;
  borichScore: number;
  borichRank: number;
  respondentCount: number;
}

export interface QualitativeTopic {
  id: string;
  topicName: string;
  needSummary: string;
  frequency: number;
  representativeQuotes: string[];
  targetRoles: string[];
  urgencyScore: number;
  importanceScore: number;
}

export type PriorityCategory = 'training' | 'non-training' | 'hold';

export interface NeedItem {
  id: string;
  sourceType: 'quantitative' | 'qualitative';
  title: string;
  description: string;
  gapOrUrgency: number; // 1.0 ~ 5.0 (가로축)
  importance: number;   // 1.0 ~ 5.0 (세로축)
  aiSuggestion?: {
    category: PriorityCategory;
    rationale: string;
  };
  finalCategory: PriorityCategory;
  userNotes: string;
  metadata?: {
    borichRank?: number;
    frequency?: number;
  };
}

export interface ReportSection {
  id: string;
  number: number;
  title: string;
  content: string;
  keyTakeaways?: string[];
}

export interface ReportDraft {
  title: string;
  subtitle?: string;
  executiveSummary: string;
  generatedAt: string;
  sections: ReportSection[];
}

export interface AnalysisProject {
  id: string;
  title: string;
  requestDepartment: string;
  targetRole: string;
  targetLevel: string;
  targetCount: number | string;
  background: string;
  expectedOutcome: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  currentStep: StepNumber;
  data: {
    survey: SurveyData;
    interviews: InterviewMemo[];
    references: ReferenceDoc[];
  };
  analysis: {
    quantitative: QuantitativeItem[];
    qualitative: QualitativeTopic[];
    lastAnalyzedAt?: string;
  };
  priorities: NeedItem[];
  report: ReportDraft | null;
}
