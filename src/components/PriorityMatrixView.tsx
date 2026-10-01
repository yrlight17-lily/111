import React, { useState, useEffect } from 'react';
import {
  Target,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Wrench,
  PauseCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Filter,
} from 'lucide-react';
import {
  AnalysisProject,
  NeedItem,
  PriorityCategory,
  StepNumber,
} from '../types';

interface PriorityMatrixViewProps {
  project: AnalysisProject;
  onUpdateProject: (updated: Partial<AnalysisProject>) => void;
  onNavigateStep: (step: StepNumber) => void;
}

export const PriorityMatrixView: React.FC<PriorityMatrixViewProps> = ({
  project,
  onUpdateProject,
  onNavigateStep,
}) => {
  const [needs, setNeeds] = useState<NeedItem[]>(project.priorities || []);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedNeedId, setSelectedNeedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | PriorityCategory>('all');

  // Sync / Initialize combined needs from quantitative + qualitative results if empty
  useEffect(() => {
    if (needs.length === 0) {
      const generatedNeeds: NeedItem[] = [];

      // 1. Add top quantitative items
      (project.analysis.quantitative || []).forEach((q) => {
        generatedNeeds.push({
          id: `need-quant-${q.id}`,
          sourceType: 'quantitative',
          title: q.itemName,
          description: `현재 ${q.currentMean.toFixed(2)}점 vs 기대 ${q.expectedMean.toFixed(2)}점 (갭 ${q.gap.toFixed(2)}, Borich ${q.borichScore.toFixed(2)})`,
          gapOrUrgency: Math.min(5, Math.max(1, Number((q.gap * 1.5).toFixed(1)))),
          importance: Math.min(5, Math.max(1, Number(q.expectedMean.toFixed(1)))),
          finalCategory: q.borichRank <= 3 ? 'training' : 'hold',
          userNotes: '',
          metadata: { borichRank: q.borichRank },
        });
      });

      // 2. Add qualitative topics
      (project.analysis.qualitative || []).forEach((topic) => {
        generatedNeeds.push({
          id: `need-qual-${topic.id}`,
          sourceType: 'qualitative',
          title: topic.topicName,
          description: topic.needSummary,
          gapOrUrgency: topic.urgencyScore || 4.2,
          importance: topic.importanceScore || 4.5,
          finalCategory: topic.topicName.includes('제도') || topic.topicName.includes('평가') ? 'non-training' : 'training',
          userNotes: '',
          metadata: { frequency: topic.frequency },
        });
      });

      if (generatedNeeds.length > 0) {
        setNeeds(generatedNeeds);
        onUpdateProject({ priorities: generatedNeeds });
      }
    }
  }, [project.analysis]);

  // Handler for Gemini AI Classification Suggestion
  const handleRunAiClassification = async () => {
    setIsSuggesting(true);
    setErrorMessage(null);

    try {
      const payloadNeeds = needs.map((n) => ({
        id: n.id,
        title: n.title,
        description: n.description,
        sourceType: n.sourceType,
      }));

      const res = await fetch('/api/ai/classify-needs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectContext: {
            title: project.title,
            targetRole: project.targetRole,
            targetLevel: project.targetLevel,
          },
          needs: payloadNeeds,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `서버 오류 (${res.status})`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'AI 제안 분류 파싱 실패');
      }

      const classifications: { id: string; category: PriorityCategory; rationale: string }[] =
        data.classifications || [];

      const updated = needs.map((need) => {
        const found = classifications.find((c) => c.id === need.id);
        if (found) {
          return {
            ...need,
            aiSuggestion: {
              category: found.category,
              rationale: found.rationale,
            },
            // If user hasn't explicitly set notes or category, apply AI recommendation
            finalCategory: found.category,
          };
        }
        return need;
      });

      setNeeds(updated);
      onUpdateProject({ priorities: updated });
    } catch (err: any) {
      console.error('Classification suggestion failed:', err);
      setErrorMessage(err.message || 'AI 분류 제안 중 오류가 발생했습니다.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleCategoryChange = (id: string, newCategory: PriorityCategory) => {
    const updated = needs.map((n) =>
      n.id === id ? { ...n, finalCategory: newCategory } : n
    );
    setNeeds(updated);
    onUpdateProject({ priorities: updated });
  };

  const handleNoteChange = (id: string, note: string) => {
    const updated = needs.map((n) =>
      n.id === id ? { ...n, userNotes: note } : n
    );
    setNeeds(updated);
    onUpdateProject({ priorities: updated });
  };

  const filteredNeeds = needs.filter((n) =>
    categoryFilter === 'all' ? true : n.finalCategory === categoryFilter
  );

  // Stats for badge
  const trainingCount = needs.filter((n) => n.finalCategory === 'training').length;
  const nonTrainingCount = needs.filter((n) => n.finalCategory === 'non-training').length;
  const holdCount = needs.filter((n) => n.finalCategory === 'hold').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
              <Target className="w-4 h-4" />
              <span>Step 5. 우선순위화 및 해결 방향 판정</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">2x2 우선순위 매트릭스 & 교육/비교육 분류</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              정량·정성 니즈를 시급성/갭과 중요도 축으로 시각화하고, 교육 과제와 비교육(제도/환경) 과제로 의사결정합니다.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleRunAiClassification}
              disabled={isSuggesting || needs.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-indigo-900 hover:bg-indigo-800 text-white shadow-md shadow-indigo-950/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSuggesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                  <span>AI 판정 분석 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Gemini 분류 제안 받기</span>
                </>
              )}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
            <span>{errorMessage}</span>
            <button
              onClick={handleRunAiClassification}
              className="px-2 py-1 bg-white border border-rose-300 rounded font-bold text-rose-700"
            >
              재시도
            </button>
          </div>
        )}

        {/* Counts summary bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-slate-500">분류 현황:</span>
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            전체 ({needs.length})
          </button>
          <button
            onClick={() => setCategoryFilter('training')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-colors ${
              categoryFilter === 'training'
                ? 'bg-blue-900 text-white'
                : 'bg-blue-50 text-blue-900 hover:bg-blue-100'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>교육으로 해결 ({trainingCount})</span>
          </button>
          <button
            onClick={() => setCategoryFilter('non-training')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-colors ${
              categoryFilter === 'non-training'
                ? 'bg-amber-800 text-white'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>비교육적 해결 ({nonTrainingCount})</span>
          </button>
          <button
            onClick={() => setCategoryFilter('hold')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-colors ${
              categoryFilter === 'hold'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <PauseCircle className="w-3.5 h-3.5" />
            <span>보류 ({holdCount})</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2X2 PRIORITY MATRIX SVG INTERACTIVE VIEW                       */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-900" />
            <span>2x2 요구분석 우선순위 매트릭스</span>
          </h2>
          <span className="text-xs text-slate-400">원을 클릭하면 아래 목록에서 해당 과제가 강조 표시됩니다.</span>
        </div>

        {/* 2x2 Visual Canvas */}
        <div className="relative w-full aspect-16/10 sm:aspect-21/9 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden p-6 select-none">
          {/* Quadrant Background Grid & Labels */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
            {/* Top-Left Quadrant: 유지 및 점검 */}
            <div className="border-r border-b border-dashed border-slate-300 p-3 bg-slate-100/30 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                제3사분면 : 유지 및 점검 (High Imp / Low Gap)
              </span>
              <span className="text-[10px] text-slate-400">현행 우수 유지 영역</span>
            </div>

            {/* Top-Right Quadrant: 최우선 집중 개선 */}
            <div className="border-b border-dashed border-slate-300 p-3 bg-blue-50/40 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1">
                <span>제1사분면 : 최우선 집중 개선 (High Imp / High Gap)</span>
              </span>
              <span className="text-[10px] text-blue-700 font-semibold">★ 핵심 교육 과정 필수 편성</span>
            </div>

            {/* Bottom-Left Quadrant: 저우선순위 / 보류 */}
            <div className="border-r border-dashed border-slate-300 p-3 bg-slate-100/50 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400">과잉투자 지양 / 보류</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                제4사분면 : 저우선순위 (Low Imp / Low Gap)
              </span>
            </div>

            {/* Bottom-Right Quadrant: 차우선 / 제도개선 */}
            <div className="p-3 bg-amber-50/30 flex flex-col justify-between">
              <span className="text-[10px] text-amber-700">제도 및 툴킷 보완 또는 2차 교육</span>
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                제2사분면 : 차우선 과제 (Low Imp / High Gap)
              </span>
            </div>
          </div>

          {/* Axis Labels */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[11px] font-bold text-slate-500 uppercase tracking-wider pointer-events-none">
            중요도 (Importance) →
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-500 uppercase tracking-wider pointer-events-none">
            갭 크기 / 시급성 (Gap / Urgency) →
          </div>

          {/* Interactive Plot Dots */}
          <div className="relative w-full h-full">
            {needs.map((item, idx) => {
              // Convert 1~5 scale to 10%~90% position
              const xPos = Math.min(92, Math.max(8, ((item.gapOrUrgency - 1) / 4) * 84 + 8));
              // Y is inverted (5 is top, 1 is bottom)
              const yPos = Math.min(92, Math.max(8, 92 - ((item.importance - 1) / 4) * 84));

              const isSelected = selectedNeedId === item.id;

              const getDotColor = (cat: PriorityCategory) => {
                switch (cat) {
                  case 'training':
                    return 'bg-blue-600 border-white text-white shadow-blue-500/50';
                  case 'non-training':
                    return 'bg-amber-600 border-white text-white shadow-amber-500/50';
                  case 'hold':
                    return 'bg-slate-500 border-white text-white shadow-slate-400/50';
                }
              };

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedNeedId(item.id)}
                  style={{ left: `${xPos}%`, top: `${yPos}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-all duration-200 z-20 ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-115'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold border-2 shadow-md ${getDotColor(
                      item.finalCategory
                    )} ${isSelected ? 'ring-3 ring-blue-900' : ''}`}
                  >
                    {idx + 1}
                  </div>

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-40 pointer-events-none w-52 p-2 bg-slate-900 text-white rounded-lg text-[11px] shadow-xl">
                    <p className="font-bold truncate">{item.title}</p>
                    <div className="mt-1 text-[10px] text-slate-300 flex justify-between">
                      <span>시급성: {item.gapOrUrgency.toFixed(1)}</span>
                      <span>중요도: {item.importance.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* NEEDS LIST & ACTION DETERMINATION TABLE                        */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              니즈 목록별 해결 방향 확정 ({filteredNeeds.length}건)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gemini AI의 제안을 참고하여 최종적으로 "교육으로 해결", "비교육적 해결", "보류"를 결정하고 실행 메모를 남기세요.
            </p>
          </div>
        </div>

        {filteredNeeds.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl">
            해당 조건의 니즈 항목이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNeeds.map((item, idx) => {
              const isSelected = selectedNeedId === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-blue-900 bg-blue-50/20 ring-2 ring-blue-900/10 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Left: Need info */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                            item.sourceType === 'quantitative'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                          }`}
                        >
                          {item.sourceType === 'quantitative' ? '정량 설문' : '정성 인터뷰/서술'}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                      </div>

                      <p className="text-xs text-slate-600 pl-7 leading-relaxed">{item.description}</p>

                      {/* AI Suggestion Box */}
                      {item.aiSuggestion && (
                        <div className="ml-7 mt-2 p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Gemini AI 추천:</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[11px] ${
                                item.aiSuggestion.category === 'training'
                                  ? 'bg-blue-100 text-blue-900'
                                  : item.aiSuggestion.category === 'non-training'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-slate-200 text-slate-800'
                              }`}
                            >
                              {item.aiSuggestion.category === 'training'
                                ? '교육으로 해결'
                                : item.aiSuggestion.category === 'non-training'
                                ? '비교육적 해결'
                                : '보류'}
                            </span>
                          </div>
                          <p className="text-indigo-900 text-[11px] leading-relaxed">
                            근거: {item.aiSuggestion.rationale}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right: Decision Button Group & Notes */}
                    <div className="lg:w-80 shrink-0 space-y-2">
                      <label className="block text-[11px] font-bold text-slate-600">
                        최종 해결 방향 결정 (사용자 선택)
                      </label>
                      <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => handleCategoryChange(item.id, 'training')}
                          className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                            item.finalCategory === 'training'
                              ? 'bg-blue-900 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          교육 해결
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCategoryChange(item.id, 'non-training')}
                          className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                            item.finalCategory === 'non-training'
                              ? 'bg-amber-800 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          비교육 해결
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCategoryChange(item.id, 'hold')}
                          className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                            item.finalCategory === 'hold'
                              ? 'bg-slate-700 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          보류
                        </button>
                      </div>

                      {/* Action Plan / Memo */}
                      <input
                        type="text"
                        value={item.userNotes || ''}
                        onChange={(e) => handleNoteChange(item.id, e.target.value)}
                        placeholder="실행 계획 및 교육/제도 개선 메모 입력"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-900"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => onNavigateStep(4)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>이전: 분석 결과</span>
        </button>

        <button
          onClick={() => onNavigateStep(6)}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-md shadow-blue-950/20 transition-all cursor-pointer"
        >
          <span>결과서 작성 단계로 이동</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
