import type { ZodIssue } from 'zod';

interface Props {
  issues: ZodIssue[];
}

export default function ValidationBanner({ issues }: Props) {
  if (issues.length === 0) return null;

  return (
    <div className="bg-red-950 border border-red-800 rounded p-3 flex flex-col gap-1">
      <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">
        {issues.length} erro{issues.length > 1 ? 's' : ''} de validação
      </span>
      <ul className="list-disc list-inside space-y-0.5">
        {issues.map((issue, i) => (
          <li key={i} className="text-xs text-red-300">
            <span className="text-red-500">[{issue.path.join('.')}]</span> {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
