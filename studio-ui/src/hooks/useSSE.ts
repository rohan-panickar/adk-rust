import { useCallback, useRef, useState } from 'react';

export function useSSE(projectId: string | null) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const esRef = useRef<EventSource | null>(null);
  const textRef = useRef('');

  const send = useCallback(
    (input: string, onComplete: (text: string) => void, onError?: (msg: string) => void) => {
      if (!projectId) return;

      textRef.current = '';
      setStreamingText('');
      setIsStreaming(true);

      const params = new URLSearchParams({ input });
      const es = new EventSource(`/api/projects/${projectId}/stream?${params}`);
      esRef.current = es;
      let ended = false;

      es.addEventListener('chunk', (e) => {
        textRef.current += e.data;
        setStreamingText(textRef.current);
      });

      es.addEventListener('end', () => {
        ended = true;
        const finalText = textRef.current;
        setStreamingText('');
        setIsStreaming(false);
        es.close();
        onComplete(finalText);
      });

      es.addEventListener('error', (e) => {
        if (!ended) {
          const msg = (e as MessageEvent).data || 'Connection error';
          setStreamingText('');
          setIsStreaming(false);
          es.close();
          onError?.(msg);
        }
      });
    },
    [projectId]
  );

  const cancel = useCallback(() => {
    esRef.current?.close();
    setStreamingText('');
    setIsStreaming(false);
  }, []);

  return { send, cancel, isStreaming, streamingText };
}
