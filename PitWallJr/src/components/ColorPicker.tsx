import type { RGB } from '../types/setup';

interface Props {
  label: string;
  value: RGB;
  onChange: (rgb: RGB) => void;
}

const CHANNELS = ['R', 'G', 'B'] as const;

export default function ColorPicker({ label, value, onChange }: Props) {
  const swatch = `rgb(${value[0]}, ${value[1]}, ${value[2]})`;

  function update(idx: 0 | 1 | 2, raw: string) {
    const n = Math.max(0, Math.min(255, parseInt(raw, 10) || 0));
    const next: RGB = [value[0], value[1], value[2]];
    next[idx] = n;
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-zinc-400 uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded border border-zinc-600 shrink-0"
          style={{ backgroundColor: swatch }}
        />
        <div className="flex flex-col gap-1 flex-1">
          {CHANNELS.map((ch, i) => (
            <div key={ch} className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 w-3">{ch}</span>
              <input
                type="range"
                min={0}
                max={255}
                value={value[i]}
                onChange={(e) => update(i as 0 | 1 | 2, e.target.value)}
                className="flex-1 h-1 accent-blue-500"
              />
              <input
                type="number"
                min={0}
                max={255}
                value={value[i]}
                onChange={(e) => update(i as 0 | 1 | 2, e.target.value)}
                className="w-12 bg-zinc-800 border border-zinc-700 rounded px-1 py-0.5 text-xs text-zinc-100 text-right focus:outline-none focus:border-blue-500"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
