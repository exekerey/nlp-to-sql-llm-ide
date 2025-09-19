import React from 'react';
import { CheckCircle, XCircle, Clock, Download, RotateCcw } from 'lucide-react';
import type { QueryResult } from '../types';

interface ResultsTableProps {
    result: QueryResult | null;
    error: string | null;
    isExecuting: boolean;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ result, error, isExecuting }) => {
    const formatCellValue = (value: any): string => {
        if (value === null || value === undefined) return 'NULL';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    };

    const exportToCsv = () => {
        if (!result) return;
        const csvContent = [
            result.columns.join(','),
            ...result.rows.map((row) =>
                row
                    .map((cell) => {
                        const value = formatCellValue(cell);
                        return value.includes(',') ? `"${value}"` : value;
                    })
                    .join(',')
            ),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'query_results.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-full flex flex-col bg-gray-900">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <h3 className="text-sm font-medium text-gray-300">Query Results</h3>
                    {result && (
                        <div className="flex items-center space-x-4 text-xs text-gray-400">
              <span className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span>{result.rowCount} rows</span>
              </span>
                            <span className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{result.executionTime}ms</span>
              </span>
                        </div>
                    )}
                    {error && (
                        <span className="flex items-center space-x-1 text-xs text-red-400">
              <XCircle className="h-3 w-3" />
              <span>Query failed</span>
            </span>
                    )}
                </div>

                {result && (
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={exportToCsv}
                            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-all duration-200"
                        >
                            <Download className="h-3 w-3" />
                            <span>Export CSV</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-hidden">
                {isExecuting ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="flex flex-col items-center space-y-3">
                            <RotateCcw className="h-8 w-8 text-blue-400 animate-spin" />
                            <p className="text-gray-400">Executing query...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center max-w-md">
                            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                            <p className="text-red-400 font-medium mb-2">Query Error</p>
                            <p className="text-gray-400 text-sm bg-gray-800 p-3 rounded border font-mono">{error}</p>
                        </div>
                    </div>
                ) : result ? (
                    <div className="h-full overflow-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-800 sticky top-0">
                            <tr>
                                {result.columns.map((column, index) => (
                                    <th
                                        key={index}
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-gray-700"
                                    >
                                        {column}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                            {result.rows.map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-gray-800 transition-colors duration-150">
                                    {row.map((cell, cellIndex) => (
                                        <td key={cellIndex} className="px-4 py-3 text-sm text-gray-300 font-mono">
                                            <div className="max-w-xs truncate" title={formatCellValue(cell)}>
                                                {cell === null || cell === undefined ? (
                                                    <span className="text-gray-500 italic">NULL</span>
                                                ) : (
                                                    formatCellValue(cell)
                                                )}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center text-gray-400">Execute a query to see results</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResultsTable;