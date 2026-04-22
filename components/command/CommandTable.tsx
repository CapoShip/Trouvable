import React from 'react';
import { COMMAND_PANEL, cn } from '@/lib/tokens';

export function CommandTable({
    headers,
    rows,
    className = '',
}: {
    headers: React.ReactNode[];
    rows: React.ReactNode[][];
    className?: string;
}) {
    return (
        <div className={cn(COMMAND_PANEL, 'overflow-hidden', className)}>
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-[12px] text-white/70">
                    <thead>
                        <tr className="border-b border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)]">
                            {headers.map((header, i) => (
                                <th key={i} className="px-4 py-3 font-semibold tracking-wide text-white/50 whitespace-nowrap">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                        {rows.map((row, i) => (
                            <tr key={i} className="transition-colors hover:bg-white/[0.03]">
                                {row.map((cell, j) => (
                                    <td key={j} className="px-4 py-3 whitespace-nowrap">
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default CommandTable;
