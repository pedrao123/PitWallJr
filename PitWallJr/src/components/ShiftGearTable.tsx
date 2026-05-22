const GEAR_LABELS = ['N', '1', '2', '3', '4', '5', '6'];

interface Props {
  rpmStart: [number, number, number, number, number, number, number];
  rpmShift: [number, number, number, number, number, number, number];
  onStartChange: (gear: number, value: number) => void;
  onShiftChange: (gear: number, value: number) => void;
}

export default function ShiftGearTable({ rpmStart, rpmShift, onStartChange, onShiftChange }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-xs text-zinc-400 uppercase tracking-wider">
            <th className="text-left py-1 pr-4 font-medium">Marcha</th>
            <th className="text-right py-1 pr-2 font-medium">RPM Start</th>
            <th className="text-right py-1 font-medium">RPM Shift</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {GEAR_LABELS.map((label, i) => {
            const invalid = i > 0 && rpmStart[i] >= rpmShift[i];
            return (
              <tr key={i} className={invalid ? 'bg-red-950/40' : ''}>
                <td className="py-1.5 pr-4">
                  <span className={`font-mono font-semibold ${invalid ? 'text-red-400' : 'text-zinc-300'}`}>
                    {label}
                  </span>
                </td>
                <td className="py-1.5 pr-2 text-right">
                  <input
                    type="number"
                    min={0}
                    max={20000}
                    value={rpmStart[i]}
                    disabled={i === 0}
                    onChange={(e) => onStartChange(i, parseInt(e.target.value, 10) || 0)}
                    className={`w-24 text-right bg-zinc-800 border rounded px-2 py-0.5 text-sm focus:outline-none
                      ${i === 0 ? 'opacity-40 cursor-not-allowed' : ''}
                      ${invalid ? 'border-red-600 text-red-300 focus:border-red-500' : 'border-zinc-700 text-zinc-100 focus:border-blue-500'}`}
                  />
                </td>
                <td className="py-1.5 text-right">
                  <input
                    type="number"
                    min={0}
                    max={20000}
                    value={rpmShift[i]}
                    disabled={i === 0}
                    onChange={(e) => onShiftChange(i, parseInt(e.target.value, 10) || 0)}
                    className={`w-24 text-right bg-zinc-800 border rounded px-2 py-0.5 text-sm focus:outline-none
                      ${i === 0 ? 'opacity-40 cursor-not-allowed' : ''}
                      ${invalid ? 'border-red-600 text-red-300 focus:border-red-500' : 'border-zinc-700 text-zinc-100 focus:border-blue-500'}`}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
