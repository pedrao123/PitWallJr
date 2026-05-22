import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface ToolchainStatus {
  gcc: boolean;
  make: boolean;
  programmer: 'ok' | 'not_installed';
  gcc_version: string | null;
}

function Badge({ label, ok, title }: { label: string; ok: boolean; title?: string }) {
  return (
    <span
      title={title}
      className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border
        ${ok
          ? 'border-green-800 text-green-400 bg-green-950/40'
          : 'border-red-800 text-red-400 bg-red-950/40'}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-400' : 'bg-red-500'}`} />
      {label}
    </span>
  );
}

export default function ToolchainBadge() {
  const [status, setStatus] = useState<ToolchainStatus | null>(null);

  async function refresh() {
    try {
      const s = await invoke<ToolchainStatus>('check_toolchain');
      setStatus(s);
    } catch {
      // silently ignore
    }
  }

  useEffect(() => { refresh(); }, []);

  if (!status) return null;

  return (
    <div className="flex items-center gap-2 ml-auto">
      <Badge
        label="GCC"
        ok={status.gcc}
        title={status.gcc_version ?? 'arm-none-eabi-gcc não encontrado'}
      />
      <Badge label="make" ok={status.make} />
      <Badge
        label="STM32Prog"
        ok={status.programmer === 'ok'}
        title={
          status.programmer === 'not_installed'
            ? 'STM32_Programmer_CLI não encontrado no PATH\nInstale o STM32CubeProgrammer e adicione o bin/ ao PATH'
            : 'STM32_Programmer_CLI ok'
        }
      />
      <button
        onClick={refresh}
        title="Verificar toolchain"
        className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
      >
        ↺
      </button>
    </div>
  );
}
