import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useSetupStore } from '../store/setupStore';
import { createDefaultSetup } from '../utils/setupDefaults';
import { importSetup } from '../utils/importExport';

export default function SetupList() {
  const { setups, activeId, addSetup, removeSetup, setActive } = useSetupStore();

  async function handleNew() {
    const setup = createDefaultSetup('Novo Setup');
    addSetup(setup);
    setActive(setup.id);
  }

  async function handleImport() {
    const path = await open({
      title: 'Importar setup',
      multiple: false,
      filters: [{ name: 'Setup JSON', extensions: ['json'] }],
    });
    if (!path || typeof path !== 'string') return;
    try {
      const json: string = await invoke('load_setup_json', { path });
      const setup = importSetup(json);
      addSetup(setup);
      setActive(setup.id);
    } catch (e) {
      console.error('Erro ao importar setup:', e);
    }
  }

  return (
    <div className="w-52 shrink-0 flex flex-col border-r border-zinc-800 bg-zinc-900">
      <div className="px-3 py-3 border-b border-zinc-800">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Setups</span>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {setups.length === 0 && (
          <p className="text-xs text-zinc-600 px-3 py-4 text-center">Nenhum setup criado</p>
        )}
        {setups.map((s) => (
          <div
            key={s.id}
            onClick={() => setActive(s.id)}
            className={`group flex items-center justify-between px-3 py-2 cursor-pointer transition-colors
              ${activeId === s.id
                ? 'bg-blue-900/40 text-blue-200'
                : 'text-zinc-300 hover:bg-zinc-800'}`}
          >
            <span className="text-sm truncate flex-1">{s.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); removeSetup(s.id); }}
              className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 text-xs ml-1 transition-opacity"
              title="Remover"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-zinc-800 p-2 flex flex-col gap-1.5">
        <button
          onClick={handleNew}
          className="w-full px-3 py-1.5 rounded text-xs font-medium bg-blue-700 text-white hover:bg-blue-600 transition-colors"
        >
          + Novo
        </button>
        <button
          onClick={handleImport}
          className="w-full px-3 py-1.5 rounded text-xs font-medium bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-colors"
        >
          Importar JSON
        </button>
      </div>
    </div>
  );
}
