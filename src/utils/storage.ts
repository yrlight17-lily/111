import { AnalysisProject } from '../types';
import { sampleProject } from './sampleData';

const STORAGE_KEY_PROJECTS = 'hrd_needs_analysis_projects_v1';
const STORAGE_KEY_ACTIVE_ID = 'hrd_needs_analysis_active_id_v1';

export function getProjects(): AnalysisProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (!raw) {
      // First time initialization: seed sample project
      saveProjects([sampleProject]);
      setActiveProjectId(sampleProject.id);
      return [sampleProject];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveProjects([sampleProject]);
      setActiveProjectId(sampleProject.id);
      return [sampleProject];
    }
    return parsed;
  } catch (e) {
    console.error('Error loading projects from localStorage', e);
    return [sampleProject];
  }
}

export function saveProjects(projects: AnalysisProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
  } catch (e) {
    console.error('Error saving projects to localStorage', e);
  }
}

export function getActiveProjectId(): string {
  try {
    const active = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
    if (active) return active;
    const projects = getProjects();
    const id = projects[0]?.id || sampleProject.id;
    setActiveProjectId(id);
    return id;
  } catch {
    return sampleProject.id;
  }
}

export function setActiveProjectId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
  } catch (e) {
    console.error('Error setting active project ID', e);
  }
}

export function getActiveProject(): AnalysisProject {
  const projects = getProjects();
  const activeId = getActiveProjectId();
  const found = projects.find((p) => p.id === activeId);
  if (found) return found;
  if (projects.length > 0) {
    setActiveProjectId(projects[0].id);
    return projects[0];
  }
  return sampleProject;
}

export function saveProject(project: AnalysisProject): void {
  const projects = getProjects();
  const index = projects.findIndex((p) => p.id === project.id);
  const updatedProject = {
    ...project,
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    projects[index] = updatedProject;
  } else {
    projects.unshift(updatedProject);
  }
  saveProjects(projects);
}

export function deleteProject(id: string): AnalysisProject[] {
  let projects = getProjects();
  projects = projects.filter((p) => p.id !== id);
  if (projects.length === 0) {
    projects = [sampleProject];
  }
  saveProjects(projects);
  setActiveProjectId(projects[0].id);
  return projects;
}

export function cloneProject(id: string): AnalysisProject {
  const projects = getProjects();
  const original = projects.find((p) => p.id === id) || sampleProject;
  const cloned: AnalysisProject = JSON.parse(JSON.stringify(original));
  cloned.id = `project-${Date.now()}`;
  cloned.title = `${original.title} (복사본)`;
  cloned.createdAt = new Date().toISOString();
  cloned.updatedAt = new Date().toISOString();
  
  projects.unshift(cloned);
  saveProjects(projects);
  setActiveProjectId(cloned.id);
  return cloned;
}

export function resetToSampleProject(): AnalysisProject {
  const projects = getProjects();
  const sampleCopy = JSON.parse(JSON.stringify(sampleProject));
  sampleCopy.id = `project-sample-${Date.now()}`;
  sampleCopy.createdAt = new Date().toISOString();
  sampleCopy.updatedAt = new Date().toISOString();
  
  projects.unshift(sampleCopy);
  saveProjects(projects);
  setActiveProjectId(sampleCopy.id);
  return sampleCopy;
}

export function createNewProject(title = '새 요구분석 프로젝트'): AnalysisProject {
  const newProj: AnalysisProject = {
    id: `project-${Date.now()}`,
    title,
    requestDepartment: '',
    targetRole: '',
    targetLevel: '',
    targetCount: '',
    background: '',
    expectedOutcome: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currentStep: 2, // Jump to settings
    data: {
      survey: {
        headers: [],
        rows: [],
        columnMapping: {},
      },
      interviews: [],
      references: [],
    },
    analysis: {
      quantitative: [],
      qualitative: [],
    },
    priorities: [],
    report: null,
  };

  const projects = getProjects();
  projects.unshift(newProj);
  saveProjects(projects);
  setActiveProjectId(newProj.id);
  return newProj;
}
