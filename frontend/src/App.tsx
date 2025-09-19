import React, { useState } from 'react';
import DatabaseConnection from './components/DatabaseConnection';
import ChatInterface from './components/ChatInterface';
import SQLEditor from './components/SQLEditor';
import ResultsTable from './components/ResultsTable';
import { Database } from 'lucide-react';
import { initConversation, sendChatMessage, executeSql, testConnection, type InitPayload } from './api';

export interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  sql?: string | null;
  timestamp: Date;
}

export interface DatabaseConfig {
  type: 'postgresql' | 'mysql' | 'sqlite';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface TableSchema {
  name: string;
  columns: {
    name: string;
    type: string;
    nullable: boolean;
    primaryKey: boolean;
    foreignKey?: string;
  }[];
}

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [dbConfig, setDbConfig] = useState<DatabaseConfig | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      type: 'assistant',
      content: "Hello! I'm your SQL AI assistant. Connect to your DB and ask me anything.",
      timestamp: new Date()
    }
  ]);

  const [currentSQL, setCurrentSQL] = useState('-- Your SQL query will appear here\n-- Try asking: "Show me all users" or "Get sales by month"');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const looksLikeSQL = (s?: string | null) => {
    if (!s) return false;
    const t = s.trim().toUpperCase();
    return /^(SELECT|INSERT|UPDATE|DELETE|WITH|CREATE|ALTER|DROP|TRUNCATE)\b/.test(t);
  };

  // обычный коннект по введённым кредам
  const handleConnect = async (config: DatabaseConfig) => {
    setConnectError(null);
    setDbConfig(config);
    setIsIndexing(true);
    try {
      const payload: InitPayload = {
        engine:
            config.type === 'postgresql' ? 'postgres' :
                config.type === 'mysql' ? 'mysql' :
                    'postgres',
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        password: config.password,
        ssl: !!config.ssl
      };

      const resp = await initConversation(payload);
      setThreadId(resp.thread_id);
      setIsConnected(true);

      setMessages(prev => [
        ...prev,
        {
          id: `schema-${Date.now()}`,
          type: 'assistant',
          content: `Connected to ${payload.engine} database "${config.database}"!\n\nReceived schema (text):\n\n${resp.schema}`,
          timestamp: new Date()
        }
      ]);
    } catch (e: any) {
      setConnectError(typeof e?.message === 'string' ? e.message : 'Failed to connect');
      setIsIndexing(false);
      return;
    }
    setIsIndexing(false);
  };

  // тестовый коннект: просто дергаем use_test_db=true и считаем, что подключены
  const handleTestConnect = async () => {
    setConnectError(null);
    setIsIndexing(true);
    try {
      const resp = await testConnection();
      setThreadId(resp.thread_id);
      setIsConnected(true);

      // логируем в чат полученную схему (без каких-либо кредов)
      setMessages(prev => [
        ...prev,
        {
          id: `schema-test-${Date.now()}`,
          type: 'assistant',
          content: `Connected to TEST database via backend.\n\nReceived schema (text):\n\n${resp.schema}`,
          timestamp: new Date()
        }
      ]);
    } catch (e: any) {
      setConnectError(typeof e?.message === 'string' ? e.message : 'Test connect failed');
      setIsIndexing(false);
      return;
    }
    setIsIndexing(false);
  };

  const handleSendMessage = async (message: string) => {
    if (!threadId) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const resp = await sendChatMessage(threadId, message);
      const serverMsg = resp.data?.[0];

      const sqlFromServer =
          (typeof serverMsg?.sql_query === 'string' ? serverMsg?.sql_query : undefined) ??
          undefined;

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        type: 'assistant',
        content: serverMsg?.content ?? '',
        sql: looksLikeSQL(sqlFromServer) ? sqlFromServer! : null,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (looksLikeSQL(sqlFromServer)) {
        setCurrentSQL(sqlFromServer!.trim());
      }
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `a-err-${Date.now()}`,
          type: 'assistant',
          content: `Error: ${e?.message ?? 'request failed'}`,
          timestamp: new Date()
        }
      ]);
    }
  };

  const executeQuery = async (sql: string) => {
    if (!threadId) return;
    setIsExecuting(true);
    setError(null);
    try {
      const start = performance.now();
      const { query_results } = await executeSql(threadId, sql);

      let columns: string[] = [];
      const rowsArray: any[][] = [];
      if (Array.isArray(query_results) && query_results.length > 0) {
        const first = query_results[0];
        if (first && typeof first === 'object' && !Array.isArray(first)) {
          columns = Object.keys(first);
          for (const r of query_results) rowsArray.push(columns.map(c => (r as any)[c]));
        } else if (Array.isArray(first)) {
          columns = first.map((_, i) => `col_${i + 1}`);
          for (const r of query_results) rowsArray.push(r as any[]);
        }
      }

      setQueryResult({
        columns,
        rows: rowsArray,
        rowCount: rowsArray.length,
        executionTime: Math.round(performance.now() - start)
      });
    } catch (e: any) {
      setError(typeof e?.message === 'string' ? e.message : 'Query failed');
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isConnected) {
    return (
        <DatabaseConnection
            onConnect={handleConnect}
            onTestConnect={handleTestConnect}
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
              <span>Connected {threadId ? `(#${threadId.slice(0,8)})` : ''}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat */}
          <div className="w-1/3 border-r border-gray-700 flex flex-col">
            <ChatInterface messages={messages} onSendMessage={handleSendMessage} />
          </div>

          {/* IDE Panel */}
          <div className="flex-1 flex flex-col">
            {/* SQL Editor */}
            <div className="h-1/2 border-b border-gray-700">
              <SQLEditor
                  sql={currentSQL}
                  onChange={setCurrentSQL}
                  onExecute={executeQuery}
                  isExecuting={isExecuting}
              />
            </div>

            {/* Results */}
            <div className="flex-1">
              <ResultsTable result={queryResult} error={error} isExecuting={isExecuting} />
            </div>
          </div>
        </div>
      </div>
  );
}

export default App;
