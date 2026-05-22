import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { useSetupStore, useActiveSetup } from '../../store/setupStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useBuildStore } from '../../store/buildStore';
import { generateConfigH } from '../../codegen/generateConfigH';
import { exportSetup } from '../../utils/importExport';
import ValidationBanner from '../ValidationBanner';
import CanTab from './tabs/CanTab';
import DisplayTab from './tabs/DisplayTab';
import LedTab from './tabs/LedTab';
import ShiftTab from './tabs/ShiftTab';
import type { DeviceSetup } from '../../types/setup';

type Tab = 'can' | 'display' | 'leds' | 'shift';

const TABS: { id: Tab; label: string }[] = [
  { id: 'can', label: 'CAN' },
  { id: 'display', label: 'Display' },
  { id: 'leds', label: 'LEDs' },
  { id: 'shift', label: 'Shift' },
];

export default function SetupEditor() {
  const setup = useActiveSetup();
  const { updateSetup, validationErrors } = useSetupStore();
  const { stm32ProjectPath } = useSettingsStore();
  const { start: buildStart, status: buildStatus, openPanel } = useBuildStore();
  const [activeTab, setActiveTab] = useState<Tab>('can');
  const [status, setStatus] = useState('');

  if (!setup) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
        Selecione ou crie um setup
      </div>
    );
  }

  const activeSetup = setup;

  function patch(p: Partial<DeviceSetup>) {
    updateSetup(activeSetup.id, p);
  }

  async function handleGenerateConfigH() {
    const path = await save({
      title: 'Salvar config.h',
      defaultPath: 'config.h',
      filters: [{ name: 'C Header', extensions: ['h'] }],
    });
    if (!path) return;
    const content = generateConfigH(activeSetup);
    try {
      await invoke('write_config_h', { content, destPath: path });
      setStatus(`config.h gerado em ${path}`);
    } catch (e) {
      setStatus(`Erro: ${e}`);
    }
  }

  async function handleSaveSetup() {
    const path = await save({
      title: 'Salvar setup',
      defaultPath: `${activeSetup.name.replace(/\s+/g, '_')}.json`,
      filters: [{ name: 'Setup JSON', extensions: ['json'] }],
    });
    if (!path) return;
    try {
      await invoke('save_setup_json', { content: exportSetup(activeSetup), destPath: path });
      setStatus(`Setup salvo em ${path}`);
    } catch (e) {
      setStatus(`Erro: ${e}`);
    }
  }

  async function handleBuildAndFlash() {
    if (!stm32ProjectPath) {
      setStatus('Configure o caminho do projeto em ⚙ Configurações antes de fazer o deploy');
      return;
    }
    buildStart();
    try {
      await invoke('build_and_flash', { projectPath: stm32ProjectPath });
    } catch (e) {
      setStatus(`Erro: ${e}`);
    }
  }

  const isValid = validationErrors.length === 0;
  const isBuilding = buildStatus === 'running';

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Setup name / description */}
      <div className="px-4 py-3 border-b border-zinc-800 space-y-2">
        <input
          value={setup.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="Nome do setup"
          className="bg-transparent text-zinc-100 text-lg font-semibold w-full focus:outline-none placeholder-zinc-600"
        />
        <input
          value={setup.description ?? ''}
          onChange={(e) => patch({ description: e.target.value || undefined })}
          placeholder="Descrição (opcional)"
          className="bg-transparent text-zinc-400 text-sm w-full focus:outline-none placeholder-zinc-700"
        />
      </div>

      {/* Validation banner */}
      {validationErrors.length > 0 && (
        <div className="px-4 pt-3">
          <ValidationBanner issues={validationErrors} />
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-zinc-800 px-4 pt-3">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px
              ${activeTab === id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'can' && (
          <CanTab value={setup.can} onChange={(can) => patch({ can })} />
        )}
        {activeTab === 'display' && (
          <DisplayTab
            display={setup.display}
            robustness={setup.robustness}
            onDisplayChange={(display) => patch({ display })}
            onRobustnessChange={(robustness) => patch({ robustness })}
          />
        )}
        {activeTab === 'leds' && (
          <LedTab value={setup.leds} onChange={(leds) => patch({ leds })} />
        )}
        {activeTab === 'shift' && (
          <ShiftTab
            value={setup.shift}
            totalLedCount={setup.leds.totalCount}
            periodMs={setup.display.periodMs}
            onChange={(shift) => patch({ shift })}
          />
        )}
      </div>

      {/* Action bar */}
      <div className="border-t border-zinc-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={handleGenerateConfigH}
          disabled={!isValid}
          className="px-4 py-1.5 rounded text-sm font-medium bg-blue-700 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Gerar config.h
        </button>
        <button
          onClick={isBuilding ? openPanel : handleBuildAndFlash}
          disabled={(!isValid || !stm32ProjectPath) && !isBuilding}
          title={!stm32ProjectPath ? 'Configure o caminho do projeto em ⚙ Configurações' : ''}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors
            ${isBuilding
              ? 'bg-blue-800 text-blue-200 cursor-pointer'
              : 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed'}`}
        >
          {isBuilding ? '● Build + Flash…' : 'Build + Flash'}
        </button>
        <button
          onClick={handleSaveSetup}
          className="px-4 py-1.5 rounded text-sm font-medium bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-colors"
        >
          Salvar setup
        </button>
        {status && (
          <span className="text-xs text-zinc-400 truncate ml-auto max-w-xs" title={status}>{status}</span>
        )}
      </div>
    </div>
  );
}
