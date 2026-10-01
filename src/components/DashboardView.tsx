import React, { useState } from 'react';
import {
  Plus,
  Sparkles,
  Layers,
  Calendar,
  Users,
  Briefcase,
  Copy,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileCheck,
} from 'lucide-react';
import { AnalysisProject, StepNumber } from '../types';

interface DashboardViewProps {
  projects: AnalysisProject[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onOpenProject: (id: string, step?: StepNumber) => void;
  onNewProject: () => void;
  onCloneProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onLoadSample: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onOpenProject,
  onNewProject,
  onCloneProject,
  onDeleteProject,
  onLoadSample,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const getStepName = (step: StepNumber) => {
    switch (step) {
      case 1:
        return '대시보드';
      case 2:
        return '기본정보 설정 중';
      case 3:
        return '데이터 수집/입력 중';
      case 4:
        return '정량·정성 분석 완료';
      case 5:
        return '우선순위 선정 완료';
      case 6:
        return '결과보고서 작성 완료';
      default:
        return '진행 중';
    }
  };

  const getStepBadge = (step: StepNumber) => {
    if (step === 6) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          <FileCheck className="w-3 h-3" />
          {getStepName(step)}
        </span>
      );
    }
    if (step >= 4) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          <CheckCircle2 className="w-3 h-3" />
          {getStepName(step)}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
        <Clock className="w-3 h-3" />
        {getStepName(step)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-800/60 border border-blue-400/30 text-blue-200 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>기업 교육과정 개발 전 요구분석 가속화 솔루션</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            체계적이고 과학적인 HRD 교육 요구분석
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
            설문 데이터(Borich 갭 분석), 심층 인터뷰 및 서술형 응답(Gemini AI 테마 추출), 2x2 우선순위화(교육 vs 제도 개선 분류), 최종 결과보고서 자동 생성까지 원스톱으로 지원합니다.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onNewProject}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/40 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>새 프로젝트 시작</span>
            </button>

            <button
              onClick={onLoadSample}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>샘플 프로젝트 불러오기 (신임팀장 과정)</span>
            </button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
      </div>

      {/* Projects List Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-900" />
            <span>요구분석 프로젝트 목록 ({projects.length}개)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">진행 중인 교육 요구분석 프로젝트를 관리하고 바로 이어서 작업하세요.</p>
        </div>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((p) => {
          const isCurrentActive = p.id === activeProjectId;
          const surveyRows = p.data?.survey?.rows?.length || 0;
          const interviewRows = p.data?.interviews?.length || 0;
          const dateCreated = p.createdAt ? new Date(p.createdAt).toLocaleDateString('ko-KR') : '';

          return (
            <div
              key={p.id}
              className={`bg-white rounded-xl border transition-all duration-200 hover:shadow-lg flex flex-col justify-between ${
                isCurrentActive
                  ? 'border-blue-900 ring-2 ring-blue-900/10 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="p-5">
                {/* Header: Badge & Date */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  {getStepBadge(p.currentStep)}
                  <span className="text-[11px] text-slate-400">{dateCreated}</span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-base text-slate-900 line-clamp-2 leading-snug hover:text-blue-900 transition-colors">
                  {p.title}
                </h3>

                {/* Target Role & Dept Info */}
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-800 truncate">
                      {p.targetRole || '대상 직무 미정'}
                    </span>
                    {p.targetLevel && <span className="text-slate-400">· {p.targetLevel}</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>예상 인원: {p.targetCount ? `${p.targetCount}명` : '미정'}</span>
                    <span className="text-slate-300">|</span>
                    <span>{p.requestDepartment || 'HRD'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{p.startDate ? `${p.startDate} ~ ${p.endDate}` : '일정 미설정'}</span>
                  </div>
                </div>

                {/* Data Collection Status Tag */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>수집 데이터:</span>
                  <div className="flex items-center gap-2 font-medium">
                    <span className={surveyRows > 0 ? 'text-blue-700' : 'text-slate-400'}>
                      설문 {surveyRows}명
                    </span>
                    <span>·</span>
                    <span className={interviewRows > 0 ? 'text-indigo-700' : 'text-slate-400'}>
                      인터뷰 {interviewRows}건
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onCloneProject(p.id)}
                    title="프로젝트 복제"
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {deleteConfirmId === p.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          onDeleteProject(p.id);
                          setDeleteConfirmId(null);
                        }}
                        className="px-2 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md"
                      >
                        삭제확인
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-1.5 py-1 text-xs text-slate-500 hover:bg-slate-200 rounded-md"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(p.id)}
                      title="프로젝트 삭제"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    onSelectProject(p.id);
                    onOpenProject(p.id, p.currentStep);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                >
                  <span>프로젝트 열기</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* New Project Quick Add Card */}
        <button
          onClick={onNewProject}
          className="border-2 border-dashed border-slate-300 hover:border-blue-900 hover:bg-blue-50/40 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all group min-h-[260px] cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-400 group-hover:text-blue-900 transition-colors mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-bold text-sm text-slate-700 group-hover:text-blue-900">
            새 요구분석 프로젝트 만들기
          </span>
          <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
            과정명과 교육 대상 정보를 입력하고 요구분석을 시작하세요.
          </p>
        </button>
      </div>
    </div>
  );
};
