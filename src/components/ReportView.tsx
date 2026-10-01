import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Download,
  Printer,
  Copy,
  CheckCircle2,
  RefreshCw,
  Edit3,
  Save,
  AlertTriangle,
  ArrowLeft,
  Eye,
  FileCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AnalysisProject, ReportDraft, ReportSection, StepNumber } from '../types';
import { exportReportToDocx } from '../utils/docxExport';

interface ReportViewProps {
  project: AnalysisProject;
  onUpdateProject: (updated: Partial<AnalysisProject>) => void;
  onNavigateStep: (step: StepNumber) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  project,
  onUpdateProject,
  onNavigateStep,
}) => {
  const [report, setReport] = useState<ReportDraft | null>(project.report);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Section editing
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');

  // Copy success indicator
  const [copySuccess, setCopySuccess] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  /**
   * Calls Gemini to generate comprehensive 6-section report draft
   */
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const surveyStats = {
        respondentCount: project.data.survey.rows.length,
        interviewCount: project.data.interviews.length,
        referenceCount: project.data.references.length,
      };

      const quantitativeSummary = (project.analysis.quantitative || []).map((q) => ({
        rank: q.borichRank,
        item: q.itemName,
        currentMean: q.currentMean,
        expectedMean: q.expectedMean,
        gap: q.gap,
        borichScore: q.borichScore,
      }));

      const qualitativeTopics = (project.analysis.qualitative || []).map((t) => ({
        topic: t.topicName,
        needSummary: t.needSummary,
        frequency: t.frequency,
        representativeQuotes: t.representativeQuotes,
        targetRoles: t.targetRoles,
      }));

      const priorityNeeds = (project.priorities || []).map((n) => ({
        title: n.title,
        finalCategory: n.finalCategory,
        gapOrUrgency: n.gapOrUrgency,
        importance: n.importance,
        aiRationale: n.aiSuggestion?.rationale,
        userNotes: n.userNotes,
      }));

      const res = await fetch('/api/ai/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectContext: {
            title: project.title,
            requestDepartment: project.requestDepartment,
            targetRole: project.targetRole,
            targetLevel: project.targetLevel,
            targetCount: project.targetCount,
            background: project.background,
            expectedOutcome: project.expectedOutcome,
            startDate: project.startDate,
            endDate: project.endDate,
          },
          surveyStats,
          quantitativeSummary,
          qualitativeTopics,
          priorityNeeds,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `서버 응답 오류 (${res.status})`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || '보고서 초안 파싱에 실패했습니다.');
      }

      const generatedDraft: ReportDraft = {
        title: data.report.title || `${project.title} 요구분석 결과보고서`,
        subtitle: data.report.subtitle || '데이터 기반 HRD 교육체계 및 실행 전략',
        executiveSummary: data.report.executiveSummary || '',
        generatedAt: new Date().toISOString(),
        sections: data.report.sections || [],
      };

      setReport(generatedDraft);
      onUpdateProject({ report: generatedDraft, currentStep: 6 });
    } catch (err: any) {
      console.error('Report generation error:', err);
      setErrorMessage(err.message || '결과서 초안 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const startEditSection = (sec: ReportSection) => {
    setEditingSectionId(sec.id);
    setEditTitle(sec.title);
    setEditContent(sec.content);
  };

  const saveEditSection = () => {
    if (!report || !editingSectionId) return;
    const updatedSections = report.sections.map((s) =>
      s.id === editingSectionId ? { ...s, title: editTitle, content: editContent } : s
    );
    const updatedReport = {
      ...report,
      sections: updatedSections,
    };
    setReport(updatedReport);
    onUpdateProject({ report: updatedReport });
    setEditingSectionId(null);
  };

  // Word (.docx) export
  const handleExportDocx = async () => {
    if (!report) return;
    setIsExportingDocx(true);
    try {
      await exportReportToDocx(project, report);
    } catch (err) {
      console.error('Docx export failed:', err);
      alert('Word 파일 내보내기 중 문제가 발생했습니다.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  // PDF Export (Native Print Dialog with styled print media)
  const handleExportPdf = () => {
    window.print();
  };

  // Copy as formatted Markdown
  const handleCopyMarkdown = () => {
    if (!report) return;

    let md = `# ${report.title}\n\n`;
    if (report.subtitle) md += `*${report.subtitle}*\n\n`;
    md += `> **Executive Summary**\n> ${report.executiveSummary}\n\n---\n\n`;

    report.sections.forEach((sec) => {
      md += `## ${sec.title}\n\n${sec.content}\n\n`;
      if (sec.keyTakeaways && sec.keyTakeaways.length > 0) {
        md += `**※ 핵심 시사점:**\n`;
        sec.keyTakeaways.forEach((t) => {
          md += `- ${t}\n`;
        });
        md += '\n';
      }
    });

    navigator.clipboard.writeText(md).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Action Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              <span>Step 6. 교육 요구분석 결과보고서</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">최종 결과보고서 초안 & 파일 내보내기</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              정량·정성 분석과 우선순위화 결과를 결합하여 표준 6대 목차의 완성형 보고서를 작성합니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {report && (
              <>
                <button
                  onClick={handleCopyMarkdown}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copySuccess ? '복사 완료!' : '마크다운 복사'}</span>
                </button>

                <button
                  onClick={handleExportPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>PDF 인쇄/저장</span>
                </button>

                <button
                  onClick={handleExportDocx}
                  disabled={isExportingDocx}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Word (.docx) 내보내기</span>
                </button>
              </>
            )}

            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                  <span>보고서 초안 작성 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{report ? '결과서 초안 재생성' : '결과서 초안 생성'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
            <span>{errorMessage}</span>
            <button
              onClick={handleGenerateReport}
              className="px-2 py-1 bg-white border border-rose-300 rounded font-bold text-rose-700"
            >
              재시도
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* REPORT CONTENT CANVAS (PRINTABLE)                              */}
      {/* ============================================================== */}
      {!report ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">아직 결과서 초안이 생성되지 않았습니다</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            상단의 <strong>[결과서 초안 생성]</strong> 버튼을 누르면 Gemini AI가 입력된 설문 통계, Borich 갭 분석 순위, 정성 테마 발언, 우선순위 판정 결과를 종합하여 표준 6대 목차로 결과서를 자동 작성합니다.
          </p>
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-md transition-all cursor-pointer mt-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>결과서 초안 지금 생성하기</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
          {/* Document Cover / Header Block */}
          <div className="border-b-2 border-blue-950 pb-6 text-center space-y-2">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">
              HRD 교육요구분석 결과보고서 (Needs Analysis Final Report)
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {report.title}
            </h1>
            {report.subtitle && (
              <p className="text-sm text-slate-600 font-medium italic">{report.subtitle}</p>
            )}

            {/* Meta Table */}
            <div className="max-w-2xl mx-auto mt-6 border border-slate-200 rounded-lg overflow-hidden text-xs text-left">
              <div className="grid grid-cols-4 bg-slate-50 divide-x divide-slate-200 border-b border-slate-200 p-2 font-bold text-slate-700">
                <span className="col-span-1 text-slate-500">과정명</span>
                <span className="col-span-3 text-slate-900">{project.title}</span>
              </div>
              <div className="grid grid-cols-4 divide-x divide-slate-200 border-b border-slate-200 p-2 text-slate-700">
                <span className="col-span-1 font-bold text-slate-500">요청부서 / 대상</span>
                <span className="col-span-3">
                  {project.requestDepartment || 'HRD'} / {project.targetRole} ({project.targetLevel}, 예상 {project.targetCount || 0}명)
                </span>
              </div>
              <div className="grid grid-cols-4 divide-x divide-slate-200 p-2 text-slate-700">
                <span className="col-span-1 font-bold text-slate-500">분석 추진 기간</span>
                <span className="col-span-3">
                  {project.startDate} ~ {project.endDate}
                </span>
              </div>
            </div>
          </div>

          {/* Executive Summary Callout Box */}
          <div className="bg-slate-50 border-l-4 border-blue-900 p-5 rounded-r-xl space-y-2">
            <h2 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-blue-900" />
              <span>Executive Summary (경영진 핵심 요약)</span>
            </h2>
            <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium">
              {report.executiveSummary}
            </p>
          </div>

          {/* Sections List */}
          <div className="space-y-8 divide-y divide-slate-100">
            {report.sections.map((sec) => {
              const isEditing = editingSectionId === sec.id;

              return (
                <div key={sec.id} className="pt-6 first:pt-0 space-y-3">
                  {/* Section Title & In-line Edit Button */}
                  <div className="flex items-center justify-between gap-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-1.5 text-base font-bold border border-blue-900 rounded-lg text-slate-900 bg-blue-50/20"
                      />
                    ) : (
                      <h2 className="text-lg font-bold text-blue-950 flex items-center gap-2">
                        <span>{sec.title}</span>
                      </h2>
                    )}

                    <div className="print:hidden">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={saveEditSection}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-md"
                          >
                            <Save className="w-3 h-3" />
                            <span>저장</span>
                          </button>
                          <button
                            onClick={() => setEditingSectionId(null)}
                            className="px-2.5 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditSection(sec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-500 hover:text-blue-900 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>섹션 편집</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Section Content */}
                  {isEditing ? (
                    <textarea
                      rows={10}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-4 text-xs font-mono border border-blue-900 rounded-xl leading-relaxed text-slate-800 bg-blue-50/10 focus:outline-hidden"
                    />
                  ) : (
                    <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line space-y-2">
                      {sec.content}
                    </div>
                  )}

                  {/* Key Takeaways */}
                  {sec.keyTakeaways && sec.keyTakeaways.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs space-y-1">
                      <span className="font-bold text-blue-900 block text-[11px]">
                        ※ 핵심 시사점 및 제언:
                      </span>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-700 text-[11px]">
                        {sec.keyTakeaways.map((k, kIdx) => (
                          <li key={kIdx}>{k}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2 print:hidden">
        <button
          onClick={() => onNavigateStep(5)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>이전: 우선순위</span>
        </button>

        <button
          onClick={() => onNavigateStep(1)}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
        >
          <span>대시보드로 돌아가기</span>
        </button>
      </div>
    </div>
  );
};
