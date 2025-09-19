import React from 'react';
import { Play, Copy, Download } from 'lucide-react';

interface SQLEditorProps {
  sql: string;
  onChange: (sql: string) => void;
  onExecute: (sql: string) => void;
  isExecuting: boolean;
}

const SQLEditor: React.FC<SQLEditorProps> = ({ sql, onChange, onExecute, isExecuting }) => {
  const handleExecute = () => {
    if (!isExecuting && sql.trim()) {
      onExecute(sql);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sql);
  };

  const handleDownload = () => {
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Editor Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-300">SQL Query</h3>
          <div className="text-xs text-gray-500">
            Press Ctrl+Enter to execute
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-all duration-200"
            title="Copy SQL"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-all duration-200"
            title="Download SQL"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={handleExecute}
            disabled={isExecuting || !sql.trim()}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded text-sm font-medium transition-all duration-200 ${
              isExecuting || !sql.trim()
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            <Play className="h-4 w-4" />
            <span>{isExecuting ? 'Executing...' : 'Execute'}</span>
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <textarea
          value={sql}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleExecute();
            }
          }}
          className="w-full h-full bg-gray-900 text-gray-100 font-mono text-sm p-4 resize-none focus:outline-none border-none leading-relaxed"
          placeholder="-- Enter your SQL query here"
          spellCheck={false}
        />

      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Lines: {sql.split('\n').length}</span>
          <span>Characters: {sql.length}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>SQL</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
};

export default SQLEditor;