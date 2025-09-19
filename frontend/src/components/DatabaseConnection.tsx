import React, { useState } from 'react';
import { Database, Server, Key, Globe, Shield, Loader, CheckCircle, AlertCircle } from 'lucide-react';
// Если у тебя типы вынесены в '../types', используй импорт снизу:
import type { DatabaseConfig } from '../types';
// Если пока тип DatabaseConfig объявлен в App.tsx – замени на:
// import type { DatabaseConfig } from '../App';

interface DatabaseConnectionProps {
  onConnect: (config: DatabaseConfig) => Promise<void> | void;
  isIndexing: boolean;
  /** Текст ошибки подключения, например «Неправильные креды…» */
  connectError?: string | null;
}

const DatabaseConnection: React.FC<DatabaseConnectionProps> = ({
                                                                 onConnect,
                                                                 isIndexing,
                                                                 connectError,
                                                               }) => {
  const [config, setConfig] = useState<DatabaseConfig>({
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: '',
    ssl: false,
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dbTypes = [
    { value: 'postgresql', label: 'PostgreSQL', defaultPort: 5432, icon: '🐘' },
    { value: 'mysql', label: 'MySQL', defaultPort: 3306, icon: '🐬' },
    { value: 'sqlite', label: 'SQLite', defaultPort: 0, icon: '📁' },
  ] as const;

  const handleTypeChange = (type: DatabaseConfig['type']) => {
    const dbType = dbTypes.find((db) => db.value === type);
    setConfig((prev) => ({
      ...prev,
      type,
      port: dbType?.defaultPort ?? prev.port,
      // Для SQLite host/port/username/password обычно не нужны
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (config.type !== 'sqlite') {
      if (!config.host?.trim()) newErrors.host = 'Host is required';
      if (!config.database?.trim()) newErrors.database = 'Database name is required';
      if (!config.username?.trim()) newErrors.username = 'Username is required';
      if (config.port == null || config.port <= 0) newErrors.port = 'Valid port is required';
    } else {
      // Для SQLite можно использовать поле database как путь/имя файла, если так удобнее
      if (!config.database?.trim()) newErrors.database = 'SQLite file path / name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConnect = async () => {
    if (!validateForm()) return;
    setIsConnecting(true);
    try {
      await onConnect(config); // родитель дергает API и сам решает, что показать
    } finally {
      setIsConnecting(false);
    }
  };

  if (isIndexing) {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <div className="mb-6">
              <Database className="h-16 w-16 text-blue-400 mx-auto mb-4 animate-pulse" />
              <h2 className="text-2xl font-bold text-white mb-2">Indexing Database</h2>
              <p className="text-gray-400">Analyzing table structure and relationships...</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Discovering tables</span>
                <CheckCircle className="h-4 w-4 text-green-400" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Analyzing columns</span>
                <Loader className="h-4 w-4 text-blue-400 animate-spin" />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Building relationships</span>
                <div className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-6">
              <div className="bg-gray-700 rounded-full h-2">
                <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-1000 animate-pulse"
                    style={{ width: '60%' }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">This may take a few moments...</p>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg shadow-2xl p-8 max-w-2xl w-full">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <Database className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Connect to Database</h1>
            <p className="text-gray-400">Configure your database connection to get started</p>
          </div>

          {/* Ошибка подключения (из родителя) */}
          {!!connectError && (
              <div className="p-3 rounded-lg bg-red-900/30 border border-red-700 text-red-300 text-sm mb-6">
                {connectError}
              </div>
          )}

          {/* Форма */}
          <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConnect();
              }}
              className="space-y-6"
          >
            {/* Тип БД */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Database Type</label>
              <div className="grid grid-cols-3 gap-3">
                {dbTypes.map((dbType) => (
                    <button
                        key={dbType.value}
                        type="button"
                        onClick={() => handleTypeChange(dbType.value as DatabaseConfig['type'])}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            config.type === dbType.value
                                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                        }`}
                    >
                      <div className="text-2xl mb-2">{dbType.icon}</div>
                      <div className="text-sm font-medium">{dbType.label}</div>
                    </button>
                ))}
              </div>
            </div>

            {/* Хост/Порт */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {config.type !== 'sqlite' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Server className="h-4 w-4 inline mr-2" />
                        Host
                      </label>
                      <input
                          type="text"
                          value={config.host}
                          onChange={(e) => setConfig((p) => ({ ...p, host: e.target.value }))}
                          className={`w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                              errors.host ? 'ring-2 ring-red-500' : ''
                          }`}
                          placeholder="localhost"
                      />
                      {errors.host && <p className="text-red-400 text-xs mt-1">{errors.host}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Globe className="h-4 w-4 inline mr-2" />
                        Port
                      </label>
                      <input
                          type="number"
                          value={config.port}
                          onChange={(e) => setConfig((p) => ({ ...p, port: parseInt(e.target.value) || 0 }))}
                          className={`w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                              errors.port ? 'ring-2 ring-red-500' : ''
                          }`}
                          placeholder={config.type === 'mysql' ? '3306' : '5432'}
                      />
                      {errors.port && <p className="text-red-400 text-xs mt-1">{errors.port}</p>}
                    </div>
                  </>
              )}
            </div>

            {/* Имя БД / путь к файлу */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Database className="h-4 w-4 inline mr-2" />
                {config.type === 'sqlite' ? 'SQLite file path / name' : 'Database Name'}
              </label>
              <input
                  type="text"
                  value={config.database}
                  onChange={(e) => setConfig((p) => ({ ...p, database: e.target.value }))}
                  className={`w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.database ? 'ring-2 ring-red-500' : ''
                  }`}
                  placeholder={config.type === 'sqlite' ? '/path/to/db.sqlite' : 'myapp_db'}
              />
              {errors.database && <p className="text-red-400 text-xs mt-1">{errors.database}</p>}
            </div>

            {/* Логин/Пароль (не требуются для SQLite) */}
            {config.type !== 'sqlite' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Key className="h-4 w-4 inline mr-2" />
                      Username
                    </label>
                    <input
                        type="text"
                        value={config.username}
                        onChange={(e) => setConfig((p) => ({ ...p, username: e.target.value }))}
                        className={`w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                            errors.username ? 'ring-2 ring-red-500' : ''
                        }`}
                        placeholder={config.type === 'mysql' ? 'root' : 'postgres'}
                    />
                    {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Shield className="h-4 w-4 inline mr-2" />
                      Password
                    </label>
                    <input
                        type="password"
                        value={config.password}
                        onChange={(e) => setConfig((p) => ({ ...p, password: e.target.value }))}
                        className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="••••••••"
                    />
                  </div>
                </div>
            )}

            {/* SSL только для Postgres (если нужно – расширь под MySQL) */}
            {config.type === 'postgresql' && (
                <div className="flex items-center space-x-3">
                  <input
                      type="checkbox"
                      id="ssl"
                      checked={!!config.ssl}
                      onChange={(e) => setConfig((p) => ({ ...p, ssl: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="ssl" className="text-sm text-gray-300">
                    Use SSL connection
                  </label>
                </div>
            )}

            {/* Кнопки */}
            <div className="flex space-x-4 pt-4">
              <button
                  type="button"
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {isConnecting ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      <span>Connecting...</span>
                    </>
                ) : (
                    <>
                      <Database className="h-4 w-4" />
                      <span>Connect</span>
                    </>
                )}
              </button>

              <button
                  type="button"
                  onClick={() => {
                    // Небольшая локальная проверка доступности сервера/валидации формы
                    if (!validateForm()) return;
                    alert('Form looks valid. The actual connection test runs on Connect.');
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <AlertCircle className="h-4 w-4" />
                <span>Validate</span>
              </button>
            </div>
          </form>
        </div>
      </div>
  );
};

export default DatabaseConnection;
