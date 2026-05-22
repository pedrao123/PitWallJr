import { open } from '@tauri-apps/plugin-dialog';
import { useSettingsStore } from '../store/settingsStore';

interface Props {
  onClose: () => void;
}

const inputCls = 'flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 font-mono';

export default function SettingsModal({ onClose }: Props) {
  const { stm32ProjectPath, setStm32ProjectPath } = useSettingsStore();

  async function browseProjeto() {
    const path = await open({ directory: true, title: 'Selecionar pasta do projeto STM32' });
    if (path && typeof path === 'string') setStm32ProjectPath(path);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg w-[560px] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <span className="font-semibold text-zinc-100">Configurações</span>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">✕</button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Caminho do projeto STM32
            </label>
            <p className="text-xs text-zinc-500">
              Pasta raiz onde o Makefile está — <code className="text-zinc-400">make -C &lt;path&gt; all</code>.
              O .elf gerado é detectado automaticamente após o build.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={stm32ProjectPath}
                onChange={(e) => setStm32ProjectPath(e.target.value)}
                placeholder="/home/user/STM32Project"
                className={inputCls}
                spellCheck={false}
              />
              <button
                onClick={browseProjeto}
                className="px-3 py-1.5 rounded text-sm bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-colors shrink-0"
              >
                Browse…
              </button>
            </div>
          </div>

          <div className="bg-zinc-800/60 border border-zinc-700 rounded p-3 space-y-1">
            <p className="text-xs font-semibold text-zinc-400">⚠ Linux — regras udev para ST-Link</p>
            <p className="text-xs text-zinc-500 mb-2">Se o flash falhar com "No ST-LINK detected", execute:</p>
            <pre className="text-xs text-zinc-300 bg-zinc-950 rounded p-2 overflow-x-auto leading-5 select-all whitespace-pre-wrap">{`echo 'SUBSYSTEM=="usb", ATTRS{idVendor}=="0483", ATTRS{idProduct}=="374b", MODE="0666"' \\
  | sudo tee /etc/udev/rules.d/49-stlinkv2.rules
sudo udevadm control --reload-rules && sudo udevadm trigger`}</pre>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded text-sm font-medium bg-blue-700 text-white hover:bg-blue-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
