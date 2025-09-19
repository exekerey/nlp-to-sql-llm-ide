import React, { useState } from 'react';
import DatabaseConnection from './components/DatabaseConnection';
import ChatInterface from './components/ChatInterface';
import SQLEditor from './components/SQLEditor';
import ResultsTable from './components/ResultsTable';
import { Database } from 'lucide-react';

import { apiConnect, apiIntrospect, apiQuery, apiGenerate } from './api';
import type { QueryResult, ChatMessage, DatabaseConfig, TableSchema, DbType } from './types';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionId, setConnectionId] = useState<string>('');
  const [connectError, setConnectError] = useState<string | null>(null);
  const [dbConfig, setDbConfig] = useState<DatabaseConfig | null>(null);
  const [schema, setSchema] = useState<TableSchema[]>([]);
  const [isIndexing, setIsIndexing] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content:
          "Hello! I'm your SQL AI assistant. Ask me anything about your database and I'll help you write queries.",
      timestamp: new Date(),
    },
  ]);

  const [currentSQL, setCurrentSQL] = useState(
      '-- Your SQL query will appear here\n-- Try asking: "Show me all users" or "Get sales by month"'
  );
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (config: DatabaseConfig) => {
    try {
      setConnectError(null);
      setDbConfig(config);
      setIsIndexing(true);

      const { connectionId } = await apiConnect(config as any);
      setConnectionId(connectionId);

      const realSchema = await apiIntrospect(connectionId);
      setSchema(realSchema);

      setIsConnected(true);
      setIsIndexing(false);

      setMessages((prev) => [
        ...prev,
        {
          id: 'schema-info',
          type: 'assistant',
          content: `Connected to ${config.type} database "${config.database}"!\n\nFound ${realSchema.length} tables: ${realSchema
              .map((t) => t.name)
              .join(', ')}`,
          timestamp: new Date(),
        },
      ]);
    } catch (e: any) {
      setIsIndexing(false);

      const raw = e?.response?.data?.error || e?.message || '';
      const msg = String(raw).toLowerCase();

      const isCredsError =
          /28p01|password authentication failed|invalid authorization|role .* does not exist|access denied|er_access_denied|client does not support authentication protocol|authentication failed|no password/i.test(
              msg
          );

      setConnectError(
          isCredsError
              ? 'Неправильные креды: проверь логин/пароль и права доступа к БД.'
              : `Ошибка подключения: ${raw}`
      );

      setMessages((prev) => [
        ...prev,
        {
          id: 'conn-error',
          type: 'assistant',
          content: isCredsError ? 'Не удалось подключиться: неправильные креды.' : `Connection error: ${raw}`,
          timestamp: new Date(),
        },
      ]);
    }
  };
  if (!isConnected) {
    return (
        <DatabaseConnection
            onConnect={handleConnect}
            isIndexing={isIndexing}
            connectError={connectError}
        />
    );
  }


  const handleSendMessage = async (message: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const dbType = (dbConfig?.type || 'postgresql') as DbType;
      const gen = await apiGenerate(message, schema, dbType);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: gen.message ?? "I've generated this SQL query for you:",
        sql: gen.sql,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setCurrentSQL(gen.sql);
    } catch (e: any) {
      const err = e?.response?.data?.error || e.message || 'Generation error';
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 2).toString(), type: 'assistant', content: `Generation error: ${err}`, timestamp: new Date() },
      ]);
    }
  };

  // Выполнение SQL через API
  const executeQuery = async (sql: string) => {
    setIsExecuting(true);
    setError(null);

    try {
      if (!connectionId) throw new Error('Not connected');
      const result = await apiQuery(connectionId, sql, 1, 500);
      setQueryResult(result);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Query error');
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isConnected) {
    return <DatabaseConnection onConnect={handleConnect} isIndexing={isIndexing} />;
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
              Connected to {dbConfig?.database} ({dbConfig?.type})
            </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Interface */}
          <div className="w-1/3 border-r border-gray-700 flex flex-col">
            <ChatInterface messages={messages} onSendMessage={handleSendMessage} />
          </div>

          {/* IDE Panel */}
          <div className="flex-1 flex flex-col">
            {/* SQL Editor */}
            <div className="h-1/2 border-b border-gray-700">
              <SQLEditor sql={currentSQL} onChange={setCurrentSQL} onExecute={executeQuery} isExecuting={isExecuting} />
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
