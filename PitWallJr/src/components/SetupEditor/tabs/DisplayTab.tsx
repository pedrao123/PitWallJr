import type { DisplayConfig, RobustnessConfig } from '../../../types/setup';

interface Props {
  display: DisplayConfig;
  robustness: RobustnessConfig;
  onDisplayChange: (d: DisplayConfig) => void;
  onRobustnessChange: (r: RobustnessConfig) => void;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-zinc-400 uppercase tracking-wider">{label}</label>
      {children}
      {hint && <span className="text-xs text-yellow-500">{hint}</span>}
    </div>
  );
}

const inputCls = 'bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 w-full';

function NumInput({ value, onChange, min = 0, max }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <input type="number" value={value} min={min} max={max}
      onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
      className={inputCls} />
  );
}

function HexInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <input type="text"
      value={'0x' + value.toString(16).toUpperCase().padStart(4, '0')}
      onChange={(e) => { const n = parseInt(e.target.value.replace(/^0x/i, ''), 16); if (!isNaN(n)) onChange(n); }}
      className={inputCls + ' font-mono'} spellCheck={false} />
  );
}

export default function DisplayTab({ display, robustness, onDisplayChange, onRobustnessChange }: Props) {
  function setDisplay<K extends keyof DisplayConfig>(key: K, val: DisplayConfig[K]) {
    onDisplayChange({ ...display, [key]: val });
  }
  function setVp(key: keyof DisplayConfig['vpAddresses'], val: number) {
    onDisplayChange({ ...display, vpAddresses: { ...display.vpAddresses, [key]: val } });
  }
  function setRob<K extends keyof RobustnessConfig>(key: K, val: RobustnessConfig[K]) {
    onRobustnessChange({ ...robustness, [key]: val });
  }

  return (
    <div className="space-y-6 p-4">
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-1">
          Display (Victor Vision / Proculus)
        </h3>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <Field label="Period (ms)" hint={display.periodMs > 200 ? '⚠ acima de 200 ms pode causar atraso visível' : undefined}>
            <NumInput value={display.periodMs} onChange={(n) => setDisplay('periodMs', Math.max(1, n))} min={1} />
          </Field>
          <Field label="Resp timeout (ms)">
            <NumInput value={display.respTimeoutMs} onChange={(n) => setDisplay('respTimeoutMs', Math.max(1, n))} min={1} />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-1">
          VP Addresses (Virtual Pointer)
        </h3>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          {(['rpm', 'gear', 'tps', 'battery', 'ect'] as const).map((key) => (
            <Field key={key} label={key.toUpperCase()}>
              <HexInput value={display.vpAddresses[key]} onChange={(n) => setVp(key, n)} />
            </Field>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-1">
          Robustez / Watchdogs
        </h3>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <Field
            label="Ciclos de falha antes do watchdog"
            hint={`${robustness.dispFailCycles * display.periodMs} ms de silêncio total`}
          >
            <NumInput value={robustness.dispFailCycles} onChange={(n) => setRob('dispFailCycles', Math.max(1, n))} min={1} max={100} />
          </Field>
          <Field label="Intervalo de reinit (ms)">
            <NumInput value={robustness.dispReinitPeriodMs} onChange={(n) => setRob('dispReinitPeriodMs', n)} min={100} max={10000} />
          </Field>
          <Field label="Timeout watchdog de tarefas (ms)">
            <NumInput value={robustness.taskWdTimeoutMs} onChange={(n) => setRob('taskWdTimeoutMs', n)} min={100} max={5000} />
          </Field>
        </div>
      </section>
    </div>
  );
}
