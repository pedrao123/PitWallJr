import { useEffect, useRef } from 'react';
import { useBuildStore } from '../store/buildStore';

const SEPARATOR_RE = /^──/;

export default function BuildPanel() {
  const { status, logs, durationMs, isPanelOpen, closePanel, clear } = useBuildStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  if (!isPanelOpen) return null;

  return (
    <div className="shrink-0 border-t border-zinc-700 bg-zinc-900 flex flex-col" style={{ height: 280 }}>
      {/* Panel header */}
      <div className="flex items-center px-4 py-2 border-b border-zinc-800 shrink-0">
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Build Log</span>

        {status === 'running' && (
          <span className="ml-3 text-xs text-blue-400 animate-pulse">● em execução…</span>
        )}
        {status === 'success' && durationMs !== null && (
          <span className="ml-3 text-xs text-green-400">✓ concluído em {(durationMs / 1000).toFixed(1)}s</span>
        )}
        {status === 'error' && (
          <span className="ml-3 text-xs text-red-400">✕ falhou</span>
        )}

        <div className="ml-auto flex items-center gap-3">
          {status !== 'running' && (
            <button onClick={clear} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              Limpar
            </button>
          )}
          <button onClick={closePanel} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            ✕
          </button>
        </div>
      </div>

      {/* Log area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 font-mono text-xs leading-5">
        {logs.map((entry, i) => {
          const isSep = SEPARATOR_RE.test(entry.line);
          return (
            <div
              key={i}
              className={
                isSep
                  ? 'text-blue-400 mt-2 mb-1 select-none'
                  : entry.type === 'stderr'
                  ? 'text-red-400'
                  : 'text-zinc-300'
              }
            >
              {entry.line || ' '}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
