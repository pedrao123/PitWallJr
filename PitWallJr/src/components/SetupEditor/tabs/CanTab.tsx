import type { CanSignalConfig } from '../../../types/setup';

interface Props {
  value: CanSignalConfig;
  onChange: (can: CanSignalConfig) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-zinc-400 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 w-full';

function HexInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <input
      type="text"
      value={'0x' + value.toString(16).toUpperCase().padStart(3, '0')}
      onChange={(e) => {
        const n = parseInt(e.target.value.replace(/^0x/i, ''), 16);
        if (!isNaN(n)) onChange(n);
      }}
      className={inputCls + ' font-mono'}
      spellCheck={false}
    />
  );
}

function NumInput({ value, onChange, min = 0, max }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
      className={inputCls}
    />
  );
}

export default function CanTab({ value, onChange }: Props) {
  function set<K extends keyof CanSignalConfig>(key: K, val: CanSignalConfig[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div className="space-y-6 p-4">
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-1">
          Base ID
        </h3>
        <div className="max-w-xs">
          <Field label="CAN Base ID (11-bit, 0x000–0x7FF)">
            <HexInput value={value.baseId} onChange={(n) => set('baseId', Math.min(0x7FF, n))} />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-1">
          Group Offsets (ID = Base + Offset)
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="RPM (+offset)">
            <NumInput value={value.offsets.rpm} onChange={(n) => set('offsets', { ...value.offsets, rpm: n })} />
          </Field>
          <Field label="ECT (+offset)">
            <NumInput value={value.offsets.ect} onChange={(n) => set('offsets', { ...value.offsets, ect: n })} />
          </Field>
          <Field label="TPS + BATT (+offset)">
            <NumInput value={value.offsets.tpsAndBatt} onChange={(n) => set('offsets', { ...value.offsets, tpsAndBatt: n })} />
          </Field>
          <Field label="Gear (+offset)">
            <NumInput value={value.offsets.gear} onChange={(n) => set('offsets', { ...value.offsets, gear: n })} />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-1">
          Byte Offsets (0–7, dentro do frame CAN)
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="RPM byte">
            <NumInput value={value.byteOffsets.rpm} onChange={(n) => set('byteOffsets', { ...value.byteOffsets, rpm: Math.min(7, n) })} min={0} max={7} />
          </Field>
          <Field label="ECT byte">
            <NumInput value={value.byteOffsets.ect} onChange={(n) => set('byteOffsets', { ...value.byteOffsets, ect: Math.min(7, n) })} min={0} max={7} />
          </Field>
          <Field label="TPS byte">
            <NumInput value={value.byteOffsets.tps} onChange={(n) => set('byteOffsets', { ...value.byteOffsets, tps: Math.min(7, n) })} min={0} max={7} />
          </Field>
          <Field label="BATT byte">
            <NumInput value={value.byteOffsets.batt} onChange={(n) => set('byteOffsets', { ...value.byteOffsets, batt: Math.min(7, n) })} min={0} max={7} />
          </Field>
          <Field label="Gear byte">
            <NumInput value={value.byteOffsets.gear} onChange={(n) => set('byteOffsets', { ...value.byteOffsets, gear: Math.min(7, n) })} min={0} max={7} />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-1">
          Timeout
        </h3>
        <div className="max-w-xs">
          <Field label="Stale timeout (ms)">
            <NumInput value={value.staleMs} onChange={(n) => set('staleMs', Math.max(1, n))} min={1} />
          </Field>
        </div>
      </section>
    </div>
  );
}
