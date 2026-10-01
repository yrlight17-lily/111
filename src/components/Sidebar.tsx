import React from 'react';
import {
  Layers,
  Settings,
  Database,
  BarChart3,
  Target,
  FileText,
  CheckCircle2,
  Calendar,
  Users,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { AnalysisProject, StepNumber } from '../types';

interface SidebarProps {
  project: AnalysisProject;
  currentStep: StepNumber;
  onSelectStep: (step: StepNumber) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  project,
  currentStep,
  onSelectStep,
}) => {
  const surveyCount = project.data.survey.rows.length;
  const interviewCount = project.data.interviews.length;
  const refCount = project.data.references.length;
  const borichCount = project.analysis.quantitative.length;
  const topicCount = project.analysis.qualitative.length;
  const priorityCount = project.priorities.length;
  const hasReport = !!project.report;

  const menuItems = [
    {
      step: 1 as StepNumber,
      label: '대시보드',
      subtext: '프로젝트 목록 및 관리',
      icon: Layers,
      badge: null,
    },
    {
      step: 2 as StepNumber,
      label: '프로젝트 설정',
      subtext: '과정 기본정보 및 배경',
      icon: Settings,
      badge: project.targetRole ? '설정됨' : '미완료',
      badgeColor: project.targetRole ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500',
    },
    {
      step: 3 as StepNumber,
      label: '데이터 입력',
      subtext: '설문, 인터뷰, 참고자료',
      icon: Database,
      badge: `${surveyCount}건 / ${interviewCount}건`,
      badgeColor: surveyCount > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500',
    },
    {
      step: 4 as StepNumber,
      label: '분석 결과',
      subtext: 'Borich 정량 & 정성 테마',
      icon: BarChart3,
      badge: borichCount > 0 || topicCount > 0 ? '분석 완료' : '대기',
      badgeColor: borichCount > 0 ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'bg-slate-100 text-slate-500',
    },
    {
      step: 5 as StepNumber,
      label: '우선순위',
      subtext: '2x2 매트릭스 & 해결방향',
      icon: Target,
      badge: priorityCount > 0 ? `${priorityCount}개 과제` : '미선정',
      badgeColor: priorityCount > 0 ? 'bg-amber-50 text-amber-700 font-semibold' : 'bg-slate-100 text-slate-500',
    },
    {
      step: 6 as StepNumber,
      label: '결과서',
      subtext: '보고서 초안 & 파일 내보내기',
      icon: FileText,
      badge: hasReport ? '초안 생성됨' : '작성 대기',
      badgeColor: hasReport ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'bg-slate-100 text-slate-500',
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-6.5rem)]">
      {/* Active Project Summary Card */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/60">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">현재 작업 프로젝트</span>
        <h2 className="text-sm font-bold text-slate-900 mt-1 line-clamp-2 leading-tight">
          {project.title}
        </h2>
        <div className="mt-3 space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{project.targetRole || '대상 직무 미정'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>예상 {project.targetCount || 0}명</span>
          </div>
          {project.startDate && (
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] text-slate-500">{project.startDate} ~ {project.endDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Menu Navigation */}
      <div className="p-3 flex-1 space-y-1">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          요구분석 프로세스
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentStep === item.step;

          return (
            <button
              key={item.step}
              onClick={() => onSelectStep(item.step)}
              className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all group ${
                isActive
                  ? 'bg-blue-900 text-white shadow-xs font-medium'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  isActive
                    ? 'bg-blue-800 text-sky-300'
                    : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isActive ? 'font-bold text-white' : 'font-semibold text-slate-900'}`}>
                    {item.step}. {item.label}
                  </span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                        isActive ? 'bg-blue-800/80 text-blue-100' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 line-clamp-1 ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                  {item.subtext}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 m-3 rounded-xl border">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
          <Sparkles className="w-4 h-4 text-blue-900" />
          <span>Gemini AI 엔진 탑재</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
          서술형 응답 테마 분류, 교육/비교육 과제 판정, 6대 표준 결과서 초안 자동 생성을 지원합니다.
        </p>
      </div>
    </aside>
  );
};
