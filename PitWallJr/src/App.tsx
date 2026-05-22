import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import './App.css';
import SetupList from './components/SetupList';
import SetupEditor from './components/SetupEditor/SetupEditor';
import ToolchainBadge from './components/ToolchainBadge';
import BuildPanel from './components/BuildPanel';
import SettingsModal from './components/SettingsModal';
import { useBuildStore } from './store/buildStore';

function useBuildEvents() {
  const { appendLog, finish } = useBuildStore();

  useEffect(() => {
    const unsubs = [
      listen<string>('build-log',     (e) => appendLog({ type: 'stdout', line: e.payload })),
      listen<string>('build-log-err', (e) => appendLog({ type: 'stderr', line: e.payload })),
      listen<boolean>('build-done',   (e) => finish(e.payload)),
    ];
    return () => { unsubs.forEach((p) => p.then((f) => f())); };
  }, [appendLog, finish]);
}

export default function App() {
  useBuildEvents();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 select-none">
      {/* Header */}
      <header className="flex items-center px-4 py-2 border-b border-zinc-800 bg-zinc-900 shrink-0 gap-3">
        <span className="font-semibold text-zinc-200 tracking-tight">PitWall Jr</span>
        <span className="text-xs text-zinc-500">Device Config</span>
        <ToolchainBadge />
        <button
          onClick={() => setSettingsOpen(true)}
          title="Configurações"
          className="ml-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
        >
          ⚙
        </button>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0 flex-col">
        <div className="flex flex-1 min-h-0">
          <SetupList />
          <main className="flex flex-1 min-w-0">
            <SetupEditor />
          </main>
        </div>
        <BuildPanel />
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
