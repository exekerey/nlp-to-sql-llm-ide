import React, { useState } from 'react';
import DatabaseConnection from './components/DatabaseConnection';
import ChatInterface from './components/ChatInterface';
import SQLEditor from './components/SQLEditor';
import ResultsTable from './components/ResultsTable';
import { Database } from 'lucide-react';

import { apiInitConversation, apiChatStream, apiChatOnce, extractSqlFromText } from './api';
import type { QueryResult, ChatMessage, DatabaseConfig, TableSchema } from './types';

// удобный форматтер ошибок, чтобы не видеть «i is not a function»
function formatError(err: unknown) {
  if (!err) return 'Unknown error';
  if (err instanceof Error) return err.stack ? `${err.message}\n${err.stack}` : err.message;
  try { return JSON.stringify(err); } catch { return String(err); }
}

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [threadId, setThreadId] = useState<string>('');
  const [dbConfig, setDbConfig] = useState<DatabaseConfig | null>(null);
  const [schema, setSchema] = useState<TableSchema[]>([]);
  const [rawSchema, setRawSchema] = useState<string | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hello! I'm your SQL AI assistant. Connect to your DB and ask me anything.`,
      timestamp: new Date(),
    },
  ]);

  const [currentSQL, setCurrentSQL] = useState(
      '-- Your SQL query will appear here\n-- Try asking: "Show me all users" or "Get sales by month"'
  );
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CONNECT
  const handleConnect = async (config: DatabaseConfig) => {
    try {
      setConnectError(null);
      setDbConfig(config);
      setIsIndexing(true);

      const { thread_id, schema: schemaPayload } = await apiInitConversation({
        ...config,
        engine: (config.engine ?? config.type)!,
      });

      // распаковка схемы безопасно
      let tables: TableSchema[] = [];
      let raw: string | null = null;

      if (Array.isArray(schemaPayload)) {
        tables = schemaPayload as TableSchema[];
      } else if (typeof schemaPayload === 'string') {
        raw = schemaPayload;
        try {
          const parsed = JSON.parse(schemaPayload);
          if (Array.isArray(parsed)) tables = parsed as TableSchema[];
        } catch {}
      }

      setThreadId(thread_id);
      setSchema(tables);
      setRawSchema(raw);
      setIsConnected(true);
      setIsIndexing(false);

      let info: string;
      if (tables.length) {
        info = `Found ${tables.length} tables: ${tables.map((t) => t.name).join(', ')}`;
      } else if (raw) {
        info = `Received schema description (text):\n\n${raw}`;
      } else {
        info = `Schema received, but format is unknown.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: 'schema-info',
          type: 'assistant',
          content: `Connected to ${config.type || config.engine} database "${config.database}"!\n\n${info}`,
          timestamp: new Date(),
        },
      ]);
    } catch (e) {
      console.error('[connect] failed:', e);
      setIsIndexing(false);
      setConnectError(formatError(e));
    }
  };

  // CHAT (stream)
  const handleSendMessage = async (message: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      type: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    const asstId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: asstId, type: 'assistant', content: '', timestamp: new Date() }]);

    try {
      let acc = '';
      await apiChatStream(threadId, message, {
        onToken: (tok) => {
          acc += tok;
          setMessages((m) => m.map((x) => (x.id === asstId ? { ...x, content: acc } : x)));
        },
        onEnd: () => {
          const sql = extractSqlFromText(acc);
          if (sql) setCurrentSQL(sql);
        },
      });
    } catch (e) {
      console.error('[chat stream] failed:', e);
      setMessages((m) =>
          m.map((x) => (x.id === asstId ? { ...x, content: `Error: ${formatError(e)}` } : x))
      );
    }
  };

  // EXECUTE (через ассистента; при наличии прямого SQL-API – замените тут)
  const executeQuery = async (sql: string) => {
    setIsExecuting(true);
    setError(null);
    setQueryResult(null);

    try {
      if (!isConnected || !threadId) throw new Error('Not connected');

      const prompt = `Execute the following SQL on the connected database and return a small result as a GitHub Markdown table (first 200 rows max). If it's not a SELECT, return an acknowledgement with affected rows.

\`\`\`sql
${sql}
\`\`\`
`;
      const text = await apiChatOnce(threadId, prompt);

      const parsed = parseMarkdownTable(text);
      if (parsed) {
        setQueryResult({
          columns: parsed.headers,
          rows: parsed.rows,
          rowCount: parsed.rows.length,
          executionTime: 0,
        });
      } else {
        setError('Не удалось распознать табличный результат. См. ответ ассистента в чате.');
      }
    } catch (e) {
      console.error('[execute] failed:', e);
      setError(formatError(e));
    } finally {
      setIsExecuting(false);
    }
  };

  function parseMarkdownTable(md: string): { headers: string[]; rows: any[][] } | null {
    const lines = md.split(/\r?\n/).map((l) => l.trim());
    const start = lines.findIndex((l) => /^\|.+\|$/.test(l));
    if (start < 0 || start + 2 >= lines.length) return null;
    const headerLine = lines[start];
    const sepLine = lines[start + 1];
    if (!/^\|(?:\s*:?-+:?\s*\|)+$/.test(sepLine)) return null;

    const headers = headerLine
        .slice(1, -1)
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean);

    const rows: any[][] = [];
    for (let i = start + 2; i < lines.length; i++) {
      const l = lines[i];
      if (!/^\|.+\|$/.test(l)) break;
      const cells = l
          .slice(1, -1)
          .split('|')
          .map((s) => s.trim());
      rows.push(cells);
    }
    if (!headers.length || !rows.length) return null;
    return { headers, rows };
  }

  if (!isConnected) {
    return (
        <DatabaseConnection
            onConnect={handleConnect}
            isIndexing={isIndexing}
            connectError={connectError}
        />
    );
  }

  return (
      <div className="h-screen bg-gray-900 text-white flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="h-8 w-8 text-blue-400" />
            <h1 className="text-xl font-bold">SQL AI Studio</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>
              Connected to {dbConfig?.database} ({dbConfig?.type || dbConfig?.engine})
            </span>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat */}
          <div className="w-1/3 border-r border-gray-700 flex flex-col">
            <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                onUseSQL={(sql) => setCurrentSQL(sql)}
                onRunSQL={(sql) => {
                  setCurrentSQL(sql);
                  executeQuery(sql);
                }}
            />
          </div>

          {/* Right pane */}
          <div className="flex-1 flex flex-col">
            <div className="h-1/2 border-b border-gray-700">
              <SQLEditor
                  sql={currentSQL}
                  onChange={setCurrentSQL}
                  onExecute={executeQuery}
                  isExecuting={isExecuting}
              />
            </div>
            <div className="flex-1">
              <ResultsTable result={queryResult} error={error} isExecuting={isExecuting} />
            </div>
          </div>
        </div>
      </div>
  );
}

export default App;
