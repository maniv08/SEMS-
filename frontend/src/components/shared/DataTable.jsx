import React from 'react';

export function DataTable({ columns, data }) {
  const safeData = Array.isArray(data) ? data : [];
  
  return (
    <div className="w-full overflow-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-border/30 text-muted border-b border-border">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="h-10 px-4 align-middle font-medium">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {safeData.map((row, i) => (
            <tr key={i} className="border-b border-border transition-colors hover:bg-border/20">
              {columns.map((col, j) => (
                <td key={j} className="p-4 align-middle">{col.cell ? col.cell(row) : row[col.accessorKey]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
