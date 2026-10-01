import React from 'react';
import {
  GraduationCap,
  Layers,
  Settings,
  Database,
  BarChart3,
  Target,
  FileText,
  PlusCircle,
  Sparkles,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import { AnalysisProject, StepNumber } from '../types';

interface HeaderProps {
  project: AnalysisProject;
  projects: AnalysisProject[];
  currentStep: StepNumber;
  onSelectStep: (step: StepNumber) => void;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onLoadSample: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  projects,
  currentStep,
  onSelectStep,
  onSelectProject,
  onNewProject,
  onLoadSample,
}) => {
  const steps: { number: StepNumber; label: string; icon: React.ReactNode }[] = [
    { number: 1, label: '대시보드', icon: <Layers className="w-4 h-4" /> },
    { number: 2, label: '프로젝트 설정', icon: <Settings className="w-4 h-4" /> },
    { number: 3, label: '데이터 입력', icon: <Database className="w-4 h-4" /> },
    { number: 4, label: '분석 결과', icon: <BarChart3 className="w-4 h-4" /> },
    { number: 5, label: '우선순위', icon: <Target className="w-4 h-4" /> },
    { number: 6, label: '결과서', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-xs">
      {/* Top Brand & Project Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-900 to-indigo-950 flex items-center justify-center text-white shadow-md shadow-blue-950/20">
              <GraduationCap className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">요구분석 도우미</span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-800 rounded-full border border-blue-200">
                  HRD Needs Analyzer
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">교육과정 개발을 위한 데이터 기반 정량·정성 요구분석</p>
            </div>
          </div>

          {/* Project Switcher & Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Project Selector Dropdown */}
            <div className="relative flex items-center">
              <FolderOpen className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={project.id}
                onChange={(e) => onSelectProject(e.target.value)}
                className="pl-9 pr-8 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-900 focus:border-transparent cursor-pointer max-w-[200px] sm:max-w-[280px] truncate"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Load Sample Button */}
            <button
              onClick={onLoadSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
              title="가상의 신임 팀장 리더십 과정 샘플 데이터를 불러옵니다"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden md:inline">샘플 불러오기</span>
            </button>

            {/* New Project Button */}
            <button
              onClick={onNewProject}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors shadow-sm shadow-blue-950/20"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>새 프로젝트</span>
            </button>
          </div>
        </div>
      </div>

      {/* Step Indicator Bar */}
      <div className="bg-slate-50/80 border-t border-slate-200 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-1 sm:space-x-2 py-2">
            {steps.map((s, idx) => {
              const isActive = currentStep === s.number;
              const isPassed = currentStep > s.number;

              return (
                <React.Fragment key={s.number}>
                  <button
                    onClick={() => onSelectStep(s.number)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-blue-900 text-white shadow-xs font-semibold'
                        : isPassed
                        ? 'text-slate-700 hover:bg-slate-200/80'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        isActive
                          ? 'bg-white text-blue-900'
                          : isPassed
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {s.number}
                    </span>
                    <span className="hidden md:inline">{s.label}</span>
                  </button>
                  {idx < steps.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
