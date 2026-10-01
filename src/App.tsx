/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ProjectSettingsView } from './components/ProjectSettingsView';
import { DataInputView } from './components/DataInputView';
import { AnalysisResultsView } from './components/AnalysisResultsView';
import { PriorityMatrixView } from './components/PriorityMatrixView';
import { ReportView } from './components/ReportView';
import {
  AnalysisProject,
  StepNumber,
} from './types';
import {
  getProjects,
  saveProject,
  getActiveProjectId,
  setActiveProjectId,
  deleteProject,
  cloneProject,
  resetToSampleProject,
  createNewProject,
} from './utils/storage';

export default function App() {
  const [projects, setProjects] = useState<AnalysisProject[]>([]);
  const [activeProjectId, setCurrentActiveProjectId] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Initial load
  useEffect(() => {
    const loadedProjects = getProjects();
    setProjects(loadedProjects);
    const activeId = getActiveProjectId();
    setCurrentActiveProjectId(activeId);

    const active = loadedProjects.find((p) => p.id === activeId) || loadedProjects[0];
    if (active) {
      setCurrentStep(active.currentStep || 1);
    }
  }, []);

  const activeProject =
    projects.find((p) => p.id === activeProjectId) || projects[0];

  // Project update handler
  const handleUpdateProject = (updatedFields: Partial<AnalysisProject>) => {
    if (!activeProject) return;
    const updated: AnalysisProject = {
      ...activeProject,
      ...updatedFields,
      updatedAt: new Date().toISOString(),
    };

    saveProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  // Step change
  const handleSelectStep = (step: StepNumber) => {
    setCurrentStep(step);
    if (activeProject) {
      handleUpdateProject({ currentStep: step });
    }
  };

  // Project select
  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    setCurrentActiveProjectId(id);
    const target = projects.find((p) => p.id === id);
    if (target) {
      setCurrentStep(target.currentStep || 1);
      showToast(`'${target.title}' 프로젝트로 전환되었습니다.`);
    }
  };

  // Open project from dashboard
  const handleOpenProject = (id: string, step?: StepNumber) => {
    handleSelectProject(id);
    if (step) {
      setCurrentStep(step);
    } else {
      setCurrentStep(2);
    }
  };

  // New project
  const handleNewProject = () => {
    const newProj = createNewProject('새 요구분석 프로젝트');
    const all = getProjects();
    setProjects(all);
    setCurrentActiveProjectId(newProj.id);
    setCurrentStep(2);
    showToast('새 요구분석 프로젝트가 생성되었습니다. 기본정보를 입력해주세요.');
  };

  // Clone project
  const handleCloneProject = (id: string) => {
    const cloned = cloneProject(id);
    const all = getProjects();
    setProjects(all);
    setCurrentActiveProjectId(cloned.id);
    showToast(`'${cloned.title}'이(가) 복제되었습니다.`);
  };

  // Delete project
  const handleDeleteProject = (id: string) => {
    const updatedProjects = deleteProject(id);
    setProjects(updatedProjects);
    const nextId = updatedProjects[0]?.id;
    if (nextId) {
      setCurrentActiveProjectId(nextId);
    }
    showToast('프로젝트가 삭제되었습니다.');
  };

  // Load sample project
  const handleLoadSample = () => {
    const sample = resetToSampleProject();
    const all = getProjects();
    setProjects(all);
    setCurrentActiveProjectId(sample.id);
    setCurrentStep(4); // Open right at analysis step
    showToast('가상의 신임 팀장 리더십 과정 샘플 데이터를 불러왔습니다!');
  };

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-blue-900 selection:text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-fade-in border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        project={activeProject}
        projects={projects}
        currentStep={currentStep}
        onSelectStep={handleSelectStep}
        onSelectProject={handleSelectProject}
        onNewProject={handleNewProject}
        onLoadSample={handleLoadSample}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Sidebar */}
        <Sidebar
          project={activeProject}
          currentStep={currentStep}
          onSelectStep={handleSelectStep}
        />

        {/* Right Dynamic Work Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {currentStep === 1 && (
            <DashboardView
              projects={projects}
              activeProjectId={activeProjectId}
              onSelectProject={handleSelectProject}
              onOpenProject={handleOpenProject}
              onNewProject={handleNewProject}
              onCloneProject={handleCloneProject}
              onDeleteProject={handleDeleteProject}
              onLoadSample={handleLoadSample}
            />
          )}

          {currentStep === 2 && (
            <ProjectSettingsView
              project={activeProject}
              onUpdateProject={handleUpdateProject}
              onNavigateStep={handleSelectStep}
            />
          )}

          {currentStep === 3 && (
            <DataInputView
              project={activeProject}
              onUpdateProject={handleUpdateProject}
              onNavigateStep={handleSelectStep}
            />
          )}

          {currentStep === 4 && (
            <AnalysisResultsView
              project={activeProject}
              onUpdateProject={handleUpdateProject}
              onNavigateStep={handleSelectStep}
            />
          )}

          {currentStep === 5 && (
            <PriorityMatrixView
              project={activeProject}
              onUpdateProject={handleUpdateProject}
              onNavigateStep={handleSelectStep}
            />
          )}

          {currentStep === 6 && (
            <ReportView
              project={activeProject}
              onUpdateProject={handleUpdateProject}
              onNavigateStep={handleSelectStep}
            />
          )}
        </main>
      </div>
    </div>
  );
}
