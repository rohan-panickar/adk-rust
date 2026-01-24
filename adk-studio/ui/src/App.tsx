import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useStore } from './store';
import { ProjectList } from './components/Projects/ProjectList';
import { Canvas } from './components/Canvas/Canvas';
import { ThemeProvider, ThemeToggle } from './components/Theme';

export default function App() {
  const { currentProject, fetchProjects } = useStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <ThemeProvider>
      <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <header 
          className="h-12 border-b flex items-center justify-between px-4"
          style={{ 
            backgroundColor: 'var(--surface-panel)', 
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)'
          }}
        >
          <div className="flex items-center">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <span className="text-2xl">🚀</span> ADK Studio
            </h1>
            {currentProject && (
              <span className="ml-4" style={{ color: 'var(--text-secondary)' }}>/ {currentProject.name}</span>
            )}
          </div>
          <ThemeToggle size={20} />
        </header>
        <main className="flex-1 overflow-hidden" style={{ backgroundColor: 'var(--bg-canvas)' }}>
          {currentProject ? (
            <ReactFlowProvider>
              <Canvas />
            </ReactFlowProvider>
          ) : (
            <ProjectList />
          )}
        </main>
      </div>
    </ThemeProvider>
  );
}
