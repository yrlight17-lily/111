import React, { useState } from 'react';
import {
  Settings,
  Briefcase,
  Users,
  Calendar,
  Building2,
  FileQuestion,
  TrendingUp,
  Save,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { AnalysisProject, StepNumber } from '../types';

interface ProjectSettingsViewProps {
  project: AnalysisProject;
  onUpdateProject: (updated: Partial<AnalysisProject>) => void;
  onNavigateStep: (step: StepNumber) => void;
}

export const ProjectSettingsView: React.FC<ProjectSettingsViewProps> = ({
  project,
  onUpdateProject,
  onNavigateStep,
}) => {
  const [formData, setFormData] = useState({
    title: project.title || '',
    requestDepartment: project.requestDepartment || '',
    targetRole: project.targetRole || '',
    targetLevel: project.targetLevel || '',
    targetCount: project.targetCount || '',
    background: project.background || '',
    expectedOutcome: project.expectedOutcome || '',
    startDate: project.startDate || '',
    endDate: project.endDate || '',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onUpdateProject({
      ...formData,
      currentStep: 2,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleNext = () => {
    onUpdateProject({
      ...formData,
      currentStep: 3,
    });
    onNavigateStep(3);
  };

  // Quick fill helper for HRD templates
  const applyQuickTemplate = (type: 'leadership' | 'onboarding' | 'sales') => {
    if (type === 'leadership') {
      setFormData({
        title: '2026 핵심 리더 피플 매니지먼트 역량 강화 과정',
        requestDepartment: '인재개발팀 / 사업총괄본부',
        targetRole: '전사 신임 팀장 및 파트장',
        targetLevel: '보직 1~2년차 (과/차장급)',
        targetCount: 40,
        background:
          '개인 기여 중심의 실무자에서 피플 매니저로의 성공적인 정체성 전환과, 1:1 대화 및 업무 위임 역량의 체계적 강화를 위해 교육 요구분석을 추진함.',
        expectedOutcome:
          '1. 팀원 1:1 상시 코칭 실행률 증대\n2. 객관적 성과 피드백 전달 기술 체득\n3. 위임 실패로 인한 팀장 과부하 해소 및 팀 몰입도 제고',
        startDate: '2026-10-20',
        endDate: '2026-11-30',
      });
    } else if (type === 'onboarding') {
      setFormData({
        title: '2026 신입 및 경력사원 조기 전력화 온보딩 과정',
        requestDepartment: '인사기획팀',
        targetRole: '신규 입사자 전원',
        targetLevel: '주니어 ~ 시니어 전 직급',
        targetCount: 60,
        background:
          '입사 후 조직 적응 및 직무 몰입 속도를 단축하고, 조직 문화와 일하는 방식에 대한 공감대를 빠르게 형성하기 위함.',
        expectedOutcome:
          '1. 입사 90일 내 조기 이탈률 50% 감축\n2. 회사 핵심 가치 및 업무 협업 툴 숙달\n3. 부서 간 협업 네트워크 조기 형성',
        startDate: '2026-11-01',
        endDate: '2026-12-15',
      });
    } else if (type === 'sales') {
      setFormData({
        title: 'B2B 솔루션 컨설팅 영업 전문가 양성 과정',
        requestDepartment: '국내영업본부 / 마케팅실',
        targetRole: '엔터프라이즈 세일즈 담당자',
        targetLevel: '영업 실무 3년차 이상',
        targetCount: 25,
        background:
          '단순 제품 판매에서 고객의 경영 과제를 선제적으로 해결하는 솔루션 제안형 세일즈로의 전환을 위한 심화 역량 분석.',
        expectedOutcome:
          '1. 고객 페인포인트 디스커버리 질문 기술 향상\n2. 맞춤형 C-Level 제안서 작성 역량 강화\n3. 수주 성사율 15% 개선',
        startDate: '2026-10-10',
        endDate: '2026-11-25',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Step Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
              <Settings className="w-4 h-4" />
              <span>Step 2. 프로젝트 기본 정보 설정</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">교육과정 개요 및 분석 범위 정의</h1>
            <p className="text-xs text-slate-500 mt-1">
              과정명, 대상, 배경 및 기대 성과를 구체적으로 작성하면 AI가 데이터 분석 및 결과보고서 작성 시 이를 정확히 반영합니다.
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-medium hidden lg:inline">예시 템플릿:</span>
            <button
              type="button"
              onClick={() => applyQuickTemplate('leadership')}
              className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
            >
              리더십
            </button>
            <button
              type="button"
              onClick={() => applyQuickTemplate('onboarding')}
              className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
            >
              온보딩
            </button>
            <button
              type="button"
              onClick={() => applyQuickTemplate('sales')}
              className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
            >
              영업역량
            </button>
          </div>
        </div>

        {/* Settings Form */}
        <div className="mt-6 space-y-5">
          {/* Row 1: Course Title */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              과정명 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="예: 2026 신임 팀장 리더십 역량 강화 과정 요구분석"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900 focus:border-transparent font-medium"
            />
          </div>

          {/* Row 2: Request Dept & Target Count */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>요청 부서</span>
              </label>
              <input
                type="text"
                name="requestDepartment"
                value={formData.requestDepartment}
                onChange={handleChange}
                placeholder="예: 인재개발팀 / 사업총괄본부"
                className="w-full px-3.5 py-2 text-sm bg-slate-50/50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>예상 교육 인원 (명)</span>
              </label>
              <input
                type="text"
                name="targetCount"
                value={formData.targetCount}
                onChange={handleChange}
                placeholder="예: 45"
                className="w-full px-3.5 py-2 text-sm bg-slate-50/50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900 focus:border-transparent"
              />
            </div>
          </div>

          {/* Row 3: Target Role & Target Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>대상 직무</span>
              </label>
              <input
                type="text"
                name="targetRole"
                value={formData.targetRole}
                onChange={handleChange}
                placeholder="예: 전사 부서장 및 팀 리더"
                className="w-full px-3.5 py-2 text-sm bg-slate-50/50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>대상 직급 / 연차</span>
              </label>
              <input
                type="text"
                name="targetLevel"
                value={formData.targetLevel}
                onChange={handleChange}
                placeholder="예: 보직 발령 1~2년차 팀장 (과장~차장급)"
                className="w-full px-3.5 py-2 text-sm bg-slate-50/50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900 focus:border-transparent"
              />
            </div>
          </div>

          {/* Row 4: Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>분석/추진 시작일</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50/50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>종료 예정일</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50/50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900 focus:border-transparent"
              />
            </div>
          </div>

          {/* Row 5: Background */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <FileQuestion className="w-3.5 h-3.5 text-slate-400" />
              <span>교육 요청 배경 (현황 및 문제의식)</span>
            </label>
            <textarea
              name="background"
              rows={4}
              value={formData.background}
              onChange={handleChange}
              placeholder="예: 최근 비즈니스 환경 변화와 세대 다양성 확대로 인해 신임 팀장들이 팀원 면담 및 업무 위임에서 고충을 겪고 있으며, 현업 관리자들의 피드백 개선 요구가 급증함..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900 focus:border-transparent leading-relaxed"
            />
          </div>

          {/* Row 6: Expected Outcome */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
              <span>기대 성과 (과정 수료 후 달성하고자 하는 목표)</span>
            </label>
            <textarea
              name="expectedOutcome"
              rows={3}
              value={formData.expectedOutcome}
              onChange={handleChange}
              placeholder="예: 1. 신임 팀장의 1:1 코칭 면담 실행률 80% 달성&#10;2. 위임 실패로 인한 팀장 번아웃 방지&#10;3. 심리적 안전감 형성을 통한 부서 내 소통 활성화"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900 focus:border-transparent leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Bottom Step Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => onNavigateStep(1)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>이전: 대시보드</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">저장 완료!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-slate-500" />
                <span>임시 저장</span>
              </>
            )}
          </button>

          <button
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-md shadow-blue-950/20 transition-all cursor-pointer"
          >
            <span>저장 후 데이터 입력으로 이동</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
