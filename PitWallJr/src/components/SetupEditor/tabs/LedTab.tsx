import type { LedConfig } from '../../../types/setup';
import ColorPicker from '../../ColorPicker';

interface Props {
  value: LedConfig;
  onChange: (leds: LedConfig) => void;
}

const inputCls = 'bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 w-full';

export default function LedTab({ value, onChange }: Props) {
  const heartbeatInvalid = value.heartbeatIdx >= value.totalCount;

  return (
    <div className="space-y-6 p-4">
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-1">
          Strip WS2812
        </h3>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400 uppercase tracking-wider">Total de LEDs</label>
            <input type="number" min={1} max={300} value={value.totalCount}
              onChange={(e) => onChange({ ...value, totalCount: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400 uppercase tracking-wider">Índice heartbeat</label>
            <input type="number" min={0} max={value.totalCount - 1} value={value.heartbeatIdx}
              onChange={(e) => onChange({ ...value, heartbeatIdx: parseInt(e.target.value, 10) || 0 })}
              className={`${inputCls} ${heartbeatInvalid ? 'border-red-600 text-red-300' : ''}`} />
            {heartbeatInvalid && (
              <span className="text-xs text-red-400">Deve ser menor que {value.totalCount}</span>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-1">
          Cores do Heartbeat
        </h3>
        <div className="grid grid-cols-1 gap-5 max-w-sm">
          <ColorPicker label="OK (verde)" value={value.heartbeatColors.ok}
            onChange={(rgb) => onChange({ ...value, heartbeatColors: { ...value.heartbeatColors, ok: rgb } })} />
          <ColorPicker label="WARN (amarelo)" value={value.heartbeatColors.warn}
            onChange={(rgb) => onChange({ ...value, heartbeatColors: { ...value.heartbeatColors, warn: rgb } })} />
          <ColorPicker label="ERROR (vermelho)" value={value.heartbeatColors.error}
            onChange={(rgb) => onChange({ ...value, heartbeatColors: { ...value.heartbeatColors, error: rgb } })} />
        </div>
      </section>
    </div>
  );
}
