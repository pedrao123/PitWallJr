import type { ShiftConfig, ShiftFixed, ShiftGear, RGB } from '../../../types/setup';
import ColorPicker from '../../ColorPicker';
import ShiftGearTable from '../../ShiftGearTable';

interface Props {
  value: ShiftConfig;
  totalLedCount: number;
  periodMs: number;
  onChange: (shift: ShiftConfig) => void;
}

const inputCls = 'bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 w-full';

function toFixed(s: ShiftConfig): ShiftFixed {
  if (s.mode === 'fixed') return s;
  return { ...s, mode: 'fixed', rpmStart: 5500, rpmShift: 7200 };
}

function toGear(s: ShiftConfig): ShiftGear {
  if (s.mode === 'gear') return s;
  return {
    ...s,
    mode: 'gear',
    rpmStartByGear: [0, 4500, 5000, 5500, 5800, 6000, 6200],
    rpmShiftByGear: [0, 6500, 6800, 7200, 7200, 7200, 7200],
  };
}

export default function ShiftTab({ value, totalLedCount, periodMs, onChange }: Props) {
  const flashHz = (1000 / (value.flashTicks * periodMs * 2)).toFixed(1);
  const flashMs = value.flashTicks * periodMs;

  function setColors(newCount: number) {
    const current = value.colors;
    const filled: RGB[] =
      newCount > current.length
        ? [...current, ...Array<RGB>(newCount - current.length).fill([0, 40, 0])]
        : current.slice(0, newCount);
    onChange({ ...value, ledCount: newCount, colors: filled });
  }

  function setColor(idx: number, rgb: RGB) {
    const next = [...value.colors] as RGB[];
    next[idx] = rgb;
    onChange({ ...value, colors: next });
  }

  const ledEndWarning = value.ledStart + value.ledCount > totalLedCount;

  return (
    <div className="space-y-6 p-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        {(['fixed', 'gear'] as const).map((m) => (
          <button
            key={m}
            onClick={() => onChange(m === 'fixed' ? toFixed(value) : toGear(value))}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors
              ${value.mode === m
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'}`}
          >
            {m === 'fixed' ? 'Fixed (RPM global)' : 'Per Gear'}
          </button>
        ))}
      </div>

      {/* RPM thresholds */}
      {value.mode === 'fixed' ? (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-1">
            RPM Thresholds
          </h3>
          <div className="space-y-3 max-w-sm">
            {(['rpmStart', 'rpmShift'] as const).map((key) => {
              const fixed = value as ShiftFixed;
              const invalid = fixed.rpmStart >= fixed.rpmShift;
              return (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-400 uppercase tracking-wider">
                    {key === 'rpmStart' ? 'RPM Start (começa a acender)' : 'RPM Shift (flash)'}
                  </label>
                  <div className="flex items-center gap-3">
                    <input type="range" min={0} max={20000} step={100}
                      value={fixed[key]}
                      onChange={(e) => onChange({ ...fixed, [key]: parseInt(e.target.value, 10) })}
                      className="flex-1 accent-blue-500" />
                    <input type="number" min={0} max={20000} value={fixed[key]}
                      onChange={(e) => onChange({ ...fixed, [key]: parseInt(e.target.value, 10) || 0 })}
                      className={`w-24 text-right bg-zinc-800 border rounded px-2 py-0.5 text-sm focus:outline-none
                        ${invalid ? 'border-red-600 text-red-300' : 'border-zinc-700 text-zinc-100 focus:border-blue-500'}`} />
                  </div>
                </div>
              );
            })}
            {(value as ShiftFixed).rpmStart >= (value as ShiftFixed).rpmShift && (
              <p className="text-xs text-red-400">RPM Start deve ser menor que RPM Shift</p>
            )}
          </div>
        </section>
      ) : (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-1">
            RPM por Marcha
          </h3>
          <ShiftGearTable
            rpmStart={(value as ShiftGear).rpmStartByGear}
            rpmShift={(value as ShiftGear).rpmShiftByGear}
            onStartChange={(gear, v) => {
              const gear_val = value as ShiftGear;
              const next = [...gear_val.rpmStartByGear] as ShiftGear['rpmStartByGear'];
              next[gear] = v;
              onChange({ ...gear_val, rpmStartByGear: next });
            }}
            onShiftChange={(gear, v) => {
              const gear_val = value as ShiftGear;
              const next = [...gear_val.rpmShiftByGear] as ShiftGear['rpmShiftByGear'];
              next[gear] = v;
              onChange({ ...gear_val, rpmShiftByGear: next });
            }}
          />
        </section>
      )}

      {/* LED strip section */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-1">
          LEDs de Shifting
        </h3>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400 uppercase tracking-wider">LED Start (índice)</label>
            <input type="number" min={0} max={totalLedCount - 1} value={value.ledStart}
              onChange={(e) => onChange({ ...value, ledStart: parseInt(e.target.value, 10) || 0 })}
              className={`${inputCls} ${ledEndWarning ? 'border-red-600 text-red-300' : ''}`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400 uppercase tracking-wider">Qtd de LEDs</label>
            <input type="number" min={1} max={totalLedCount} value={value.ledCount}
              onChange={(e) => setColors(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className={`${inputCls} ${ledEndWarning ? 'border-red-600 text-red-300' : ''}`} />
          </div>
        </div>
        {ledEndWarning && (
          <p className="text-xs text-red-400">
            Start ({value.ledStart}) + Count ({value.ledCount}) = {value.ledStart + value.ledCount} excede totalCount ({totalLedCount})
          </p>
        )}
      </section>

      {/* Per-LED colors */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-1">
          Cor por LED (índice 0 = menor RPM)
        </h3>
        <div className="grid grid-cols-2 gap-5">
          {value.colors.map((c, i) => (
            <ColorPicker key={i} label={`LED ${i}`} value={c} onChange={(rgb) => setColor(i, rgb)} />
          ))}
        </div>
      </section>

      {/* Flash */}
      <section className="space-y-4">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-1">
          Flash (acima do RPM de shift)
        </h3>
        <div className="max-w-sm">
          <ColorPicker label="Cor do flash" value={value.flashColor}
            onChange={(rgb) => onChange({ ...value, flashColor: rgb })} />
        </div>
        <div className="flex flex-col gap-1 max-w-sm">
          <label className="text-xs text-zinc-400 uppercase tracking-wider">
            Flash ticks — {value.flashTicks} ticks × {periodMs} ms = ~{flashMs} ms ({flashHz} Hz)
          </label>
          <input type="range" min={1} max={30} value={value.flashTicks}
            onChange={(e) => onChange({ ...value, flashTicks: parseInt(e.target.value, 10) })}
            className="accent-blue-500" />
          {value.flashTicks > 20 && (
            <span className="text-xs text-yellow-500">⚠ acima de 20 ticks: frequência abaixo de ~1.2 Hz, flash lento</span>
          )}
        </div>
      </section>
    </div>
  );
}
