import { useState, useCallback } from 'react';
import { api, GeneratedProject } from '../api/client';

export interface BuildOutput {
  success: boolean;
  output: string;
  path: string | null;
}

/**
 * Hook for managing build and compile operations.
 * Extracts build-related state from Canvas component.
 */
export function useBuild(projectId: string | undefined) {
  const [building, setBuilding] = useState(false);
  const [buildOutput, setBuildOutput] = useState<BuildOutput | null>(null);
  const [builtBinaryPath, setBuiltBinaryPath] = useState<string | null>(null);
  const [compiledCode, setCompiledCode] = useState<GeneratedProject | null>(null);

  // Compile project to view generated code
  const compile = useCallback(async () => {
    if (!projectId) return null;
    try {
      const code = await api.projects.compile(projectId);
      setCompiledCode(code);
      return code;
    } catch (e) {
      const error = e as Error;
      alert('Compile failed: ' + error.message);
      return null;
    }
  }, [projectId]);

  // Build project via SSE stream
  const build = useCallback(async () => {
    if (!projectId) return;
    
    setBuilding(true);
    setBuildOutput({ success: false, output: '', path: null });
    
    const es = new EventSource(`/api/projects/${projectId}/build-stream`);
    let output = '';
    
    es.addEventListener('status', (e) => {
      output += e.data + '\n';
      setBuildOutput({ success: false, output, path: null });
    });
    
    es.addEventListener('output', (e) => {
      output += e.data + '\n';
      setBuildOutput({ success: false, output, path: null });
    });
    
    es.addEventListener('done', (e) => {
      setBuildOutput({ success: true, output, path: e.data });
      setBuiltBinaryPath(e.data);
      setBuilding(false);
      es.close();
    });
    
    es.addEventListener('error', (e) => {
      output += '\nError: ' + ((e as MessageEvent).data || 'Build failed');
      setBuildOutput({ success: false, output, path: null });
      setBuilding(false);
      es.close();
    });
    
    es.onerror = () => {
      setBuilding(false);
      es.close();
    };
  }, [projectId]);

  // Clear build output (for closing modal)
  const clearBuildOutput = useCallback(() => {
    setBuildOutput(null);
  }, []);

  // Clear compiled code (for closing modal)
  const clearCompiledCode = useCallback(() => {
    setCompiledCode(null);
  }, []);

  // Invalidate build when project changes
  const invalidateBuild = useCallback(() => {
    setBuiltBinaryPath(null);
  }, []);

  return {
    // State
    building,
    buildOutput,
    builtBinaryPath,
    compiledCode,
    
    // Actions
    build,
    compile,
    clearBuildOutput,
    clearCompiledCode,
    invalidateBuild,
    
    // Computed
    needsBuild: !builtBinaryPath,
  };
}
