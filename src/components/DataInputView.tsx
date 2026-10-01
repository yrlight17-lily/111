import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Database,
  FileSpreadsheet,
  MessageSquare,
  FileText,
  Upload,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Download,
  Calendar,
  User,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
} from 'lucide-react';
import {
  AnalysisProject,
  ColumnType,
  InterviewMemo,
  ReferenceDoc,
  StepNumber,
  SurveyData,
} from '../types';

interface DataInputViewProps {
  project: AnalysisProject;
  onUpdateProject: (updated: Partial<AnalysisProject>) => void;
  onNavigateStep: (step: StepNumber) => void;
}

export const DataInputView: React.FC<DataInputViewProps> = ({
  project,
  onUpdateProject,
  onNavigateStep,
}) => {
  const [activeTab, setActiveTab] = useState<'survey' | 'interview' | 'reference'>('survey');

  // Survey Data State
  const [surveyData, setSurveyData] = useState<SurveyData>(project.data.survey);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Interview Memo State
  const [interviews, setInterviews] = useState<InterviewMemo[]>(project.data.interviews);
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [memoForm, setMemoForm] = useState<{
    sourceRole: InterviewMemo['sourceRole'];
    intervieweeName: string;
    date: string;
    content: string;
  }>({
    sourceRole: '학습자(현업)',
    intervieweeName: '',
    date: new Date().toISOString().split('T')[0],
    content: '',
  });

  // Reference Docs State
  const [references, setReferences] = useState<ReferenceDoc[]>(project.data.references);
  const [editingRefId, setEditingRefId] = useState<string | null>(null);
  const [refForm, setRefForm] = useState<{
    title: string;
    category: ReferenceDoc['category'];
    content: string;
  }>({
    title: '',
    category: '직무기술서',
    content: '',
  });

  // Save changes to project
  const saveAllData = (
    newSurvey = surveyData,
    newInterviews = interviews,
    newReferences = references
  ) => {
    onUpdateProject({
      data: {
        survey: newSurvey,
        interviews: newInterviews,
        references: newReferences,
      },
    });
  };

  /* ------------------------------------------------------------- */
  /* Tab 1: Survey File Upload & Column Mapping                    */
  /* ------------------------------------------------------------- */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rawJson.length === 0) {
          alert('엑셀/CSV 파일에 데이터 행이 없습니다.');
          return;
        }

        const headers = Object.keys(rawJson[0]);
        const initialMapping: Record<string, ColumnType> = {};

        // Auto-detect column roles based on header names
        headers.forEach((h) => {
          const lower = h.toLowerCase();
          if (lower.includes('id') || lower.includes('부서') || lower.includes('이름') || lower.includes('순번')) {
            initialMapping[h] = 'ignore';
          } else if (
            lower.includes('현재') ||
            lower.includes('current') ||
            lower.includes('실행도') ||
            lower.includes('보유')
          ) {
            initialMapping[h] = 'current';
          } else if (
            lower.includes('기대') ||
            lower.includes('expected') ||
            lower.includes('중요도') ||
            lower.includes('필요도')
          ) {
            initialMapping[h] = 'expected';
          } else if (
            lower.includes('서술') ||
            lower.includes('의견') ||
            lower.includes('요구') ||
            lower.includes('코멘트') ||
            lower.includes('비고')
          ) {
            initialMapping[h] = 'text';
          } else if (lower.includes('항목') || lower.includes('역량') || lower.includes('과업')) {
            initialMapping[h] = 'item';
          } else {
            // Default check value type of first row
            const val = rawJson[0][h];
            if (typeof val === 'number') {
              initialMapping[h] = 'current';
            } else {
              initialMapping[h] = 'ignore';
            }
          }
        });

        const newSurvey: SurveyData = {
          fileName: file.name,
          headers,
          rows: rawJson,
          columnMapping: initialMapping,
        };

        setSurveyData(newSurvey);
        saveAllData(newSurvey, interviews, references);
      } catch (err: any) {
        console.error('File parsing error:', err);
        alert(`파일을 읽는 중 오류가 발생했습니다: ${err.message}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleColumnTypeChange = (colName: string, newType: ColumnType) => {
    const updatedMapping = {
      ...surveyData.columnMapping,
      [colName]: newType,
    };
    const updated = {
      ...surveyData,
      columnMapping: updatedMapping,
    };
    setSurveyData(updated);
    saveAllData(updated, interviews, references);
  };

  // Generate Excel template for users
  const downloadTemplate = () => {
    const sampleHeaders = [
      {
        응답자ID: 'R01',
        소속: '사업부문',
        '1:1 코칭 면담_현재': 2,
        '1:1 코칭 면담_기대': 5,
        '성과관리 피드백_현재': 3,
        '성과관리 피드백_기대': 5,
        '업무 위임_현재': 2,
        '업무 위임_기대': 4,
        서술형_애로사항: '팀원과의 면담 시 피드백 전달 모델이 필요합니다.',
      },
      {
        응답자ID: 'R02',
        소속: '개발부문',
        '1:1 코칭 면담_현재': 1,
        '1:1 코칭 면담_기대': 4,
        '성과관리 피드백_현재': 2,
        '성과관리 피드백_기대': 5,
        '업무 위임_현재': 3,
        '업무 위임_기대': 5,
        서술형_애로사항: '업무 위임 시 기준과 마일스톤 점검 방법이 고민입니다.',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleHeaders);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '설문요구조사샘플');
    XLSX.writeFile(wb, '교육요구분석_설문양식_샘플.xlsx');
  };

  /* ------------------------------------------------------------- */
  /* Tab 2: Interview / FGI Handlers                               */
  /* ------------------------------------------------------------- */
  const handleAddMemo = () => {
    if (!memoForm.content.trim()) {
      alert('인터뷰 메모 내용을 입력해주세요.');
      return;
    }

    let updated: InterviewMemo[];
    if (editingMemoId) {
      updated = interviews.map((m) =>
        m.id === editingMemoId ? { ...m, ...memoForm } : m
      );
      setEditingMemoId(null);
    } else {
      const newMemo: InterviewMemo = {
        id: `memo-${Date.now()}`,
        ...memoForm,
      };
      updated = [newMemo, ...interviews];
    }

    setInterviews(updated);
    saveAllData(surveyData, updated, references);
    setMemoForm({
      sourceRole: '학습자(현업)',
      intervieweeName: '',
      date: new Date().toISOString().split('T')[0],
      content: '',
    });
  };

  const handleEditMemo = (memo: InterviewMemo) => {
    setEditingMemoId(memo.id);
    setMemoForm({
      sourceRole: memo.sourceRole,
      intervieweeName: memo.intervieweeName || '',
      date: memo.date,
      content: memo.content,
    });
  };

  const handleDeleteMemo = (id: string) => {
    const updated = interviews.filter((m) => m.id !== id);
    setInterviews(updated);
    saveAllData(surveyData, updated, references);
  };

  /* ------------------------------------------------------------- */
  /* Tab 3: Reference Documents Handlers                           */
  /* ------------------------------------------------------------- */
  const handleAddRef = () => {
    if (!refForm.title.trim() || !refForm.content.trim()) {
      alert('자료 제목과 본문 내용을 모두 입력해주세요.');
      return;
    }

    let updated: ReferenceDoc[];
    if (editingRefId) {
      updated = references.map((r) =>
        r.id === editingRefId ? { ...r, ...refForm, updatedAt: new Date().toISOString() } : r
      );
      setEditingRefId(null);
    } else {
      const newDoc: ReferenceDoc = {
        id: `ref-${Date.now()}`,
        ...refForm,
        updatedAt: new Date().toISOString(),
      };
      updated = [newDoc, ...references];
    }

    setReferences(updated);
    saveAllData(surveyData, interviews, updated);
    setRefForm({
      title: '',
      category: '직무기술서',
      content: '',
    });
  };

  const handleEditRef = (doc: ReferenceDoc) => {
    setEditingRefId(doc.id);
    setRefForm({
      title: doc.title,
      category: doc.category,
      content: doc.content,
    });
  };

  const handleDeleteRef = (id: string) => {
    const updated = references.filter((r) => r.id !== id);
    setReferences(updated);
    saveAllData(surveyData, interviews, updated);
  };

  const currentCount = Object.values(surveyData.columnMapping).filter((v) => v === 'current').length;
  const expectedCount = Object.values(surveyData.columnMapping).filter((v) => v === 'expected').length;
  const textCount = Object.values(surveyData.columnMapping).filter((v) => v === 'text').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner & Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
              <Database className="w-4 h-4" />
              <span>Step 3. 분석 데이터 수집 및 입력</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">다각적 요구분석 데이터 입력</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              정량 설문 데이터와 심층 인터뷰 메모, 참고 자료(직무기술서/조직현황)를 등록하세요.
            </p>
          </div>

          {/* Tab Navigation Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setActiveTab('survey')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'survey'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>1. 설문 데이터 ({surveyData.rows.length}명)</span>
            </button>
            <button
              onClick={() => setActiveTab('interview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'interview'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>2. 인터뷰·FGI 메모 ({interviews.length}건)</span>
            </button>
            <button
              onClick={() => setActiveTab('reference')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'reference'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>3. 참고 자료 ({references.length}건)</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: SURVEY DATA                                             */}
        {/* ============================================================== */}
        {activeTab === 'survey' && (
          <div className="mt-6 space-y-6">
            {/* Upload Area */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-900 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-900 shrink-0">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {surveyData.fileName ? `업로드 파일: ${surveyData.fileName}` : '설문 엑셀(XLSX) 또는 CSV 파일 업로드'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    [가정: 문항별 현재 수준(1~5점)과 기대 수준(중요도, 1~5점), 서술형 응답이 포함된 표]
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>샘플 양식 받기</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>파일 선택하여 업로드</span>
                </button>
              </div>
            </div>

            {/* Column Mapping Summary Pill */}
            {surveyData.rows.length > 0 && (
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-blue-900 shrink-0" />
                  <span className="font-bold text-blue-950">
                    총 {surveyData.rows.length}명 응답 데이터 로드 완료
                  </span>
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="px-2 py-0.5 bg-white rounded-md border border-blue-200">
                      현재 수준: <strong>{currentCount}개 열</strong>
                    </span>
                    <span className="px-2 py-0.5 bg-white rounded-md border border-blue-200">
                      기대 수준: <strong>{expectedCount}개 열</strong>
                    </span>
                    <span className="px-2 py-0.5 bg-white rounded-md border border-blue-200">
                      서술형: <strong>{textCount}개 열</strong>
                    </span>
                  </div>
                </div>

                <div className="text-slate-500 text-[11px] flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>각 열 헤더의 드롭다운을 통해 문항의 역할을 지정할 수 있습니다.</span>
                </div>
              </div>
            )}

            {/* Preview & Column Designation Table */}
            {surveyData.rows.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    열(Column) 용도 지정 및 데이터 미리보기 (상위 5건 표시)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    전체 {surveyData.headers.length}개 열 × {surveyData.rows.length}개 행
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[420px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 font-bold text-slate-500 w-12 text-center border-r border-slate-200">
                          #
                        </th>
                        {surveyData.headers.map((h) => {
                          const currentType = surveyData.columnMapping[h] || 'ignore';

                          const getTypeBadgeColor = (type: ColumnType) => {
                            switch (type) {
                              case 'current':
                                return 'bg-amber-100 text-amber-900 border-amber-300';
                              case 'expected':
                                return 'bg-blue-100 text-blue-900 border-blue-300';
                              case 'text':
                                return 'bg-purple-100 text-purple-900 border-purple-300';
                              case 'item':
                                return 'bg-emerald-100 text-emerald-900 border-emerald-300';
                              default:
                                return 'bg-slate-100 text-slate-500 border-slate-300';
                            }
                          };

                          return (
                            <th key={h} className="p-2.5 min-w-[160px] border-r border-slate-200 last:border-r-0">
                              <div className="space-y-1.5">
                                <div className="font-bold text-slate-900 truncate" title={h}>
                                  {h}
                                </div>
                                <select
                                  value={currentType}
                                  onChange={(e) => handleColumnTypeChange(h, e.target.value as ColumnType)}
                                  className={`w-full px-2 py-1 text-[11px] font-semibold rounded-md border transition-all cursor-pointer ${getTypeBadgeColor(
                                    currentType
                                  )}`}
                                >
                                  <option value="current">현재 수준 (1~5점)</option>
                                  <option value="expected">기대 수준/중요도 (1~5점)</option>
                                  <option value="text">서술형 응답</option>
                                  <option value="item">역량/과업 항목명</option>
                                  <option value="ignore">무시 (제외)</option>
                                </select>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {surveyData.rows.slice(0, 5).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-2.5 text-center text-slate-400 font-mono border-r border-slate-100">
                            {rIdx + 1}
                          </td>
                          {surveyData.headers.map((h) => (
                            <td
                              key={h}
                              className="p-2.5 text-slate-700 max-w-[240px] truncate border-r border-slate-100 last:border-r-0"
                              title={String(row[h])}
                            >
                              {String(row[h]) || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                등록된 설문 데이터가 없습니다. 상단의 샘플 양식을 확인하시거나 엑셀 파일을 업로드해주세요.
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: INTERVIEWS & FGI MEMOS                                 */}
        {/* ============================================================== */}
        {activeTab === 'interview' && (
          <div className="mt-6 space-y-6">
            {/* Input Form */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-900" />
                <span>{editingMemoId ? '인터뷰 메모 수정' : '새 인터뷰 / FGI 메모 추가'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Source Role */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    출처 (대상자 유형) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={memoForm.sourceRole}
                    onChange={(e) =>
                      setMemoForm((prev) => ({ ...prev, sourceRole: e.target.value as any }))
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                  >
                    <option value="학습자(현업)">학습자 (현업 실무자/팀장)</option>
                    <option value="현업 관리자(팀장/임원)">현업 관리자 (사업부장/임원)</option>
                    <option value="경영진">경영진 (C-Level / CHO)</option>
                    <option value="인사/HRD 담당자">인사 / HRD 담당자</option>
                    <option value="기타 실무자">기타 실무자 (전임 강사 등)</option>
                  </select>
                </div>

                {/* Interviewee Name / Detail */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">인터뷰 대상자 / 직책</label>
                  <input
                    type="text"
                    value={memoForm.intervieweeName}
                    onChange={(e) =>
                      setMemoForm((prev) => ({ ...prev, intervieweeName: e.target.value }))
                    }
                    placeholder="예: 김OO 팀장 (개발1팀, 1년차)"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">면담 일자</label>
                  <input
                    type="date"
                    value={memoForm.date}
                    onChange={(e) => setMemoForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  인터뷰 녹취록 / FGI 메모 내용 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={memoForm.content}
                  onChange={(e) => setMemoForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="면담자의 구체적인 발언이나 고충을 붙여넣으세요. 생생한 원문 발언일수록 AI가 정확한 대표 인용문과 니즈 테마를 분류해냅니다."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 leading-relaxed"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                {editingMemoId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMemoId(null);
                      setMemoForm({
                        sourceRole: '학습자(현업)',
                        intervieweeName: '',
                        date: new Date().toISOString().split('T')[0],
                        content: '',
                      });
                    }}
                    className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg"
                  >
                    수정 취소
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddMemo}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{editingMemoId ? '메모 수정 완료' : '인터뷰 메모 추가'}</span>
                </button>
              </div>
            </div>

            {/* List of Memos */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                등록된 인터뷰 및 FGI 메모 ({interviews.length}건)
              </h4>

              {interviews.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  등록된 인터뷰 메모가 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {interviews.map((memo) => (
                    <div
                      key={memo.id}
                      className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                              {memo.sourceRole}
                            </span>
                            {memo.intervieweeName && (
                              <span className="text-xs font-semibold text-slate-800">
                                {memo.intervieweeName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{memo.date}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                          {memo.content}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleEditMemo(memo)}
                          className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-slate-100 rounded-md transition-colors"
                          title="수정"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMemo(memo.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: REFERENCE DOCUMENTS                                     */}
        {/* ============================================================== */}
        {activeTab === 'reference' && (
          <div className="mt-6 space-y-6">
            {/* Input Form */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-900" />
                <span>{editingRefId ? '참고 자료 수정' : '새 참고 자료 텍스트 붙여넣기'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    자료명 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={refForm.title}
                    onChange={(e) => setRefForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="예: 신임 팀장 R&R 명세서 및 2025 리더십 다면진단 결과"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">자료 분류</label>
                  <select
                    value={refForm.category}
                    onChange={(e) =>
                      setRefForm((prev) => ({ ...prev, category: e.target.value as any }))
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                  >
                    <option value="직무기술서">직무기술서 (JD/R&R)</option>
                    <option value="역량모델">역량 모델 (Competency Model)</option>
                    <option value="과정 만족도 결과">기존 과정 만족도/평가 결과</option>
                    <option value="조직진단/성과지표">조직진단 / 성과지표(KPI)</option>
                    <option value="기타">기타 참고자료</option>
                  </select>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  자료 내용 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={refForm.content}
                  onChange={(e) => setRefForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="직무역량 체계표, 평가 결과 수치, 사내 가이드라인 내용을 텍스트로 붙여넣으세요."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {editingRefId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRefId(null);
                      setRefForm({
                        title: '',
                        category: '직무기술서',
                        content: '',
                      });
                    }}
                    className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg"
                  >
                    수정 취소
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddRef}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{editingRefId ? '자료 수정 완료' : '참고 자료 추가'}</span>
                </button>
              </div>
            </div>

            {/* List of References */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                등록된 참고 자료 목록 ({references.length}건)
              </h4>

              {references.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  등록된 참고 자료가 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {references.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200">
                              {doc.category}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{doc.title}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {doc.content}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleEditRef(doc)}
                          className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-slate-100 rounded-md transition-colors"
                          title="수정"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRef(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => onNavigateStep(2)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>이전: 프로젝트 설정</span>
        </button>

        <button
          onClick={() => onNavigateStep(4)}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-md shadow-blue-950/20 transition-all cursor-pointer"
        >
          <span>분석 결과 단계로 이동</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
