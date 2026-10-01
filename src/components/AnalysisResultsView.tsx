import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Sparkles,
  RefreshCw,
  Table as TableIcon,
  Flame,
  MessageSquare,
  Edit2,
  Trash2,
  GitMerge,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Info,
  Layers,
} from 'lucide-react';
import {
  AnalysisProject,
  QualitativeTopic,
  QuantitativeItem,
  StepNumber,
} from '../types';
import { calculateBorichNeeds } from '../utils/borich';

interface AnalysisResultsViewProps {
  project: AnalysisProject;
  onUpdateProject: (updated: Partial<AnalysisProject>) => void;
  onNavigateStep: (step: StepNumber) => void;
}

export const AnalysisResultsView: React.FC<AnalysisResultsViewProps> = ({
  project,
  onUpdateProject,
  onNavigateStep,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sorting state for quantitative table
  const [sortField, setSortField] = useState<'borichRank' | 'gap' | 'expectedMean' | 'currentMean'>('borichRank');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Quantitative view toggle: 'table' vs 'chart'
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  // Topic editing state
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editTopicName, setEditTopicName] = useState('');
  const [editTopicSummary, setEditTopicSummary] = useState('');

  // Topic merging state
  const [mergeSourceId, setMergeSourceId] = useState<string | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<string | null>(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  const quantitativeList = project.analysis.quantitative || [];
  const qualitativeList = project.analysis.qualitative || [];

  /**
   * Run Analysis Handler:
   * 1. Calculates Borich quantitative gap in-code
   * 2. Calls backend Gemini endpoint for qualitative clustering
   */
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      // 1. Calculate quantitative Borich needs
      const quantResults = calculateBorichNeeds(project.data.survey);

      // 2. Extract qualitative texts
      const surveyTextCol = Object.entries(project.data.survey.columnMapping).find(
        ([, type]) => type === 'text'
      )?.[0];

      const surveyComments: string[] = [];
      if (surveyTextCol) {
        project.data.survey.rows.forEach((r) => {
          const val = String(r[surveyTextCol] || '').trim();
          if (val) surveyComments.push(val);
        });
      }

      const interviewMemos = project.data.interviews.map((m) => ({
        sourceRole: m.sourceRole,
        date: m.date,
        content: m.content,
      }));

      const referenceDocs = project.data.references.map((r) => ({
        title: r.title,
        content: r.content,
      }));

      // Call server-side Gemini qualitative analysis
      const res = await fetch('/api/ai/qualitative-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectContext: {
            title: project.title,
            targetRole: project.targetRole,
            targetLevel: project.targetLevel,
            background: project.background,
            expectedOutcome: project.expectedOutcome,
          },
          surveyComments,
          interviewMemos,
          referenceDocs,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `서버 오류 발생 (${res.status})`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || '정성 분석 결과 파싱에 실패했습니다.');
      }

      const topics: QualitativeTopic[] = data.topics || [];

      // Save analysis results to project
      onUpdateProject({
        analysis: {
          quantitative: quantResults,
          qualitative: topics,
          lastAnalyzedAt: new Date().toISOString(),
        },
        currentStep: 4,
      });
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setErrorMessage(err.message || 'AI 분석 처리 중 예상치 못한 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Sorting quantitative items
  const sortedQuantitative = [...quantitativeList].sort((a, b) => {
    let diff = 0;
    if (sortField === 'borichRank') {
      diff = a.borichRank - b.borichRank;
    } else {
      diff = (b[sortField] as number) - (a[sortField] as number);
    }
    return sortAsc ? diff : -diff;
  });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Topic Edit handlers
  const startEditTopic = (topic: QualitativeTopic) => {
    setEditingTopicId(topic.id);
    setEditTopicName(topic.topicName);
    setEditTopicSummary(topic.needSummary);
  };

  const saveEditTopic = () => {
    if (!editingTopicId) return;
    const updated = qualitativeList.map((t) =>
      t.id === editingTopicId
        ? { ...t, topicName: editTopicName, needSummary: editTopicSummary }
        : t
    );
    onUpdateProject({
      analysis: {
        ...project.analysis,
        qualitative: updated,
      },
    });
    setEditingTopicId(null);
  };

  // Topic Delete handler
  const handleDeleteTopic = (id: string) => {
    if (!confirm('이 주제를 삭제하시겠습니까?')) return;
    const updated = qualitativeList.filter((t) => t.id !== id);
    onUpdateProject({
      analysis: {
        ...project.analysis,
        qualitative: updated,
      },
    });
  };

  // Topic Merge handlers
  const handleOpenMergeModal = (sourceId: string) => {
    setMergeSourceId(sourceId);
    const firstOther = qualitativeList.find((t) => t.id !== sourceId);
    setMergeTargetId(firstOther ? firstOther.id : null);
    setIsMergeModalOpen(true);
  };

  const executeMerge = () => {
    if (!mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId) return;

    const sourceTopic = qualitativeList.find((t) => t.id === mergeSourceId);
    const targetTopic = qualitativeList.find((t) => t.id === mergeTargetId);
    if (!sourceTopic || !targetTopic) return;

    const mergedQuotes = Array.from(
      new Set([...targetTopic.representativeQuotes, ...sourceTopic.representativeQuotes])
    ).slice(0, 4);

    const mergedRoles = Array.from(
      new Set([...targetTopic.targetRoles, ...sourceTopic.targetRoles])
    );

    const updated = qualitativeList
      .filter((t) => t.id !== mergeSourceId)
      .map((t) =>
        t.id === mergeTargetId
          ? {
              ...t,
              frequency: t.frequency + sourceTopic.frequency,
              needSummary: `${t.needSummary} 또한, ${sourceTopic.needSummary}`,
              representativeQuotes: mergedQuotes,
              targetRoles: mergedRoles,
            }
          : t
      );

    onUpdateProject({
      analysis: {
        ...project.analysis,
        qualitative: updated,
      },
    });

    setIsMergeModalOpen(false);
    setMergeSourceId(null);
    setMergeTargetId(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Action Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
              <BarChart3 className="w-4 h-4" />
              <span>Step 4. 정량·정성 분석 결과</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">Borich 요구도 갭 분석 & Gemini 정성 분석</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              정량 설문 갭 계산 및 서술형/인터뷰 데이터의 AI 주제별 클러스터링을 실행합니다.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {project.analysis.lastAnalyzedAt && (
              <span className="text-xs text-slate-400 hidden lg:inline">
                마지막 분석: {new Date(project.analysis.lastAnalyzedAt).toLocaleTimeString('ko-KR')}
              </span>
            )}

            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-900 hover:bg-blue-800 text-white shadow-md shadow-blue-950/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                  <span>AI 분석 진행 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>AI 분석 실행</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Alert with Retry */}
        {errorMessage && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={handleRunAnalysis}
              className="px-2.5 py-1 bg-white border border-rose-300 rounded-md font-bold text-rose-700 hover:bg-rose-100 transition-colors"
            >
              재시도
            </button>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* 1. QUANTITATIVE BORICH GAP ANALYSIS                              */}
      {/* ================================================================ */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>1. 정량 갭 분석 (Borich 요구도 산출)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              공식: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-900 font-mono font-semibold">Borich = (기대 - 현재)의 합 × 기대수준 평균 ÷ 응답자수</code>
            </p>
          </div>

          {/* Toggle View Mode */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>표로 보기</span>
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'chart' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>차트로 보기</span>
            </button>
          </div>
        </div>

        {quantitativeList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            정량 분석 데이터가 없습니다. 상단의 <strong>[AI 분석 실행]</strong> 버튼을 클릭하여 설문 데이터를 계산하세요.
          </div>
        ) : viewMode === 'table' ? (
          /* Table View */
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th
                      onClick={() => toggleSort('borichRank')}
                      className="p-3 text-center w-16 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>순위</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="p-3">역량 / 과업 항목명</th>
                    <th
                      onClick={() => toggleSort('currentMean')}
                      className="p-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>현재 수준 (평균)</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort('expectedMean')}
                      className="p-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>기대 수준 (평균)</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort('gap')}
                      className="p-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>차이 (Gap)</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort('borichRank')}
                      className="p-3 text-right font-extrabold text-blue-900 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Borich 요구도</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="p-3 text-center">우선순위 판정</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedQuantitative.map((item) => {
                    const isTopPriority = item.borichRank <= 3;

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isTopPriority ? 'bg-blue-50/20 font-medium' : ''
                        }`}
                      >
                        <td className="p-3 text-center">
                          <span
                            className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                              item.borichRank === 1
                                ? 'bg-amber-500 text-white'
                                : item.borichRank === 2
                                ? 'bg-slate-400 text-white'
                                : item.borichRank === 3
                                ? 'bg-amber-700 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.borichRank}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-900">{item.itemName}</td>
                        <td className="p-3 text-right font-mono text-slate-600">
                          {item.currentMean.toFixed(2)}점
                        </td>
                        <td className="p-3 text-right font-mono text-blue-900 font-semibold">
                          {item.expectedMean.toFixed(2)}점
                        </td>
                        <td className="p-3 text-right font-mono text-rose-600 font-bold">
                          +{item.gap.toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono text-blue-950 font-extrabold text-sm">
                          {item.borichScore.toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          {isTopPriority ? (
                            <span className="px-2 py-0.5 text-[11px] font-bold bg-rose-100 text-rose-800 rounded-full">
                              최우선 교육
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 rounded-full">
                              차우선/유지
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Recharts Bar Chart View */
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedQuantitative}
                  margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="itemName"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar
                    dataKey="currentMean"
                    name="현재 수준 (평균)"
                    fill="#94A3B8"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expectedMean"
                    name="기대 수준 (중요도)"
                    fill="#1E3A8A"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-center text-xs text-slate-500">
              ※ 각 항목별 현재 보유 수준(회색)과 기대 요구 수준(남색)의 차이가 클수록 Borich 요구도 점수가 높습니다.
            </div>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* 2. QUALITATIVE TOPIC ANALYSIS (GEMINI)                           */}
      {/* ================================================================ */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>2. 정성 분석 결과 (Gemini AI 테마 분류)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              서술형 응답 및 인터뷰 녹취록에서 추출된 주요 니즈 테마, 언급 빈도 및 원문 대표 발언입니다.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-800 rounded-lg border border-indigo-200 self-start sm:self-auto">
            총 {qualitativeList.length}개 주제 도출됨
          </span>
        </div>

        {qualitativeList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            정성 분석 결과가 없습니다. 상단의 <strong>[AI 분석 실행]</strong> 버튼을 클릭하여 서술형 응답과 인터뷰 메모를 분석하세요.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {qualitativeList.map((topic) => {
              const isEditing = editingTopicId === topic.id;

              return (
                <div
                  key={topic.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header: Topic Title & Badges */}
                    <div className="flex items-start justify-between gap-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editTopicName}
                          onChange={(e) => setEditTopicName(e.target.value)}
                          className="w-full px-2.5 py-1 text-sm font-bold border border-blue-900 rounded-md bg-blue-50/40 text-slate-900"
                        />
                      ) : (
                        <h3 className="font-bold text-sm text-slate-900 leading-snug">
                          {topic.topicName}
                        </h3>
                      )}

                      <span className="shrink-0 px-2 py-0.5 text-xs font-bold bg-blue-50 text-blue-900 rounded-md border border-blue-200">
                        언급 {topic.frequency}회
                      </span>
                    </div>

                    {/* Needs Summary */}
                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={editTopicSummary}
                        onChange={(e) => setEditTopicSummary(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs border border-blue-900 rounded-md bg-blue-50/40 text-slate-900 leading-relaxed"
                      />
                    ) : (
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {topic.needSummary}
                      </p>
                    )}

                    {/* Target Roles */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-400 font-medium">발언 주체:</span>
                      {topic.targetRoles.map((role, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-700 rounded-md"
                        >
                          {role}
                        </span>
                      ))}
                    </div>

                    {/* Verbatim Quotes */}
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        현장 원문 대표 발언 (Verbatim Quotes)
                      </span>
                      <div className="space-y-1.5">
                        {topic.representativeQuotes.map((quote, qIdx) => (
                          <div
                            key={qIdx}
                            className="text-xs text-slate-700 italic bg-amber-50/40 border-l-2 border-amber-400 pl-2.5 py-1 pr-2 rounded-r-md"
                          >
                            “{quote}”
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={saveEditTopic}
                          className="px-3 py-1 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-md"
                        >
                          저장
                        </button>
                        <button
                          onClick={() => setEditingTopicId(null)}
                          className="px-2.5 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditTopic(topic)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>수정</span>
                        </button>
                        <button
                          onClick={() => handleOpenMergeModal(topic.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-md transition-colors"
                        >
                          <GitMerge className="w-3 h-3" />
                          <span>주제 합치기</span>
                        </button>
                        <button
                          onClick={() => handleDeleteTopic(topic.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>삭제</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Merge Topic Modal */}
      {isMergeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-indigo-600" />
              <span>주제(Topic) 통합하기</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              선택한 주제를 다른 주제와 병합합니다. 니즈 요약과 대표 발언, 언급 빈도가 통합됩니다.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                통합될 대상(목적지) 주제 선택
              </label>
              <select
                value={mergeTargetId || ''}
                onChange={(e) => setMergeTargetId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
              >
                {qualitativeList
                  .filter((t) => t.id !== mergeSourceId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.topicName} (언급 {t.frequency}회)
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsMergeModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                취소
              </button>
              <button
                onClick={executeMerge}
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >
                통합 실행
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => onNavigateStep(3)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>이전: 데이터 입력</span>
        </button>

        <button
          onClick={() => onNavigateStep(5)}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-md shadow-blue-950/20 transition-all cursor-pointer"
        >
          <span>우선순위 선정 단계로 이동</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
