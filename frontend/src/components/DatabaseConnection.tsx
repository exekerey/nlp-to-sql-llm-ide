import React, { useState } from 'react';
import { Database, Server, Key, Globe, Shield, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import type { DatabaseConfig } from '../types';

interface DatabaseConnectionProps {
  onConnect: (config: DatabaseConfig) => Promise<void> | void;
  isIndexing: boolean;
  connectError?: string | null;
}

const DatabaseConnection: React.FC<DatabaseConnectionProps> = ({
                                                                 onConnect,
                                                                 isIndexing,
                                                                 connectError,
                                                               }) => {
  const [config, setConfig] = useState<DatabaseConfig>({
    type: 'postgres',
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
    { value: 'postgres',   label: 'Postgres',         defaultPort: 5432, icon: '🐘' },
    { value: 'mysql',      label: 'MySQL',            defaultPort: 3306, icon: '🐬' },
    { value: 'clickhouse', label: 'ClickHouse',       defaultPort: 8123, icon: '⚡️' },
    { value: 'plsql',      label: 'Oracle (PL/SQL)',  defaultPort: 1521, icon: '🏺' },
  ] as const;

  const handleTypeChange = (type: NonNullable<DatabaseConfig['type']>) => {
    const dbType = dbTypes.find((db) => db.value === type);
    setConfig((prev) => ({
      ...prev,
      type,
      port: dbType?.defaultPort ?? prev.port,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!config.host?.trim()) newErrors.host = 'Host is required';
    if (!config.database?.trim()) newErrors.database = 'Database name is required';
    if (!config.username?.trim()) newErrors.username = 'Username is required';
    if (config.port == null || Number(config.port) <= 0) newErrors.port = 'Valid port is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConnectClick = async () => {
    if (!validateForm()) return;
    setIsConnecting(true);
    try {
      await onConnect({ ...config, engine: config.type }); // type -> engine
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
            </div>
            <div className="mt-6">
              <div className="bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all duration-1000 animate-pulse" style={{ width: '60%' }} />
              </div>
              <p className="text-xs text-gray-500 mt-2">This may take a few moments...</p>
            </div>
          </div>
        </div>
    );
  }

  const usernamePlaceholder =
      config.type === 'mysql' ? 'root' :
          config.type === 'clickhouse' ? 'default' :
              config.type === 'plsql' ? 'system' : 'postgres';

  const portPlaceholder =
      config.type === 'mysql' ? '3306' :
          config.type === 'clickhouse' ? '8123' :
              config.type === 'plsql' ? '1521' : '5432';

  return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg shadow-2xl p-8 max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <Database className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Connect to Database</h1>
            <p className="text-gray-400">Configure your database connection to get started</p>
          </div>

          {!!connectError && (
              <div className="p-3 rounded-lg bg-red-900/30 border border-red-700 text-red-300 text-sm mb-6">
                {connectError}
              </div>
          )}

          <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConnectClick();
              }}
              className="space-y-6"
          >
            {/* DB Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Database Type</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {dbTypes.map((dbType) => (
                    <button
                        key={dbType.value}
                        type="button"
                        onClick={() => handleTypeChange(dbType.value)}
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

            {/* Host / Port */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    value={config.port || ''} // пустая строка, если 0
                    onChange={(e) =>
                        setConfig((p) => ({
                          ...p,
                          port: e.target.value ? parseInt(e.target.value, 10) : 0,
                        }))
                    }
                    className={`w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.port ? 'ring-2 ring-red-500' : ''
                    }`}
                    placeholder={portPlaceholder}
                />
                {errors.port && <p className="text-red-400 text-xs mt-1">{errors.port}</p>}
              </div>
            </div>

            {/* Database */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Database className="h-4 w-4 inline mr-2" />
                Database Name / Service
              </label>
              <input
                  type="text"
                  value={config.database}
                  onChange={(e) => setConfig((p) => ({ ...p, database: e.target.value }))}
                  className={`w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.database ? 'ring-2 ring-red-500' : ''
                  }`}
                  placeholder={config.type === 'plsql' ? 'XE / ORCL' : 'myapp_db'}
              />
              {errors.database && <p className="text-red-400 text-xs mt-1">{errors.database}</p>}
            </div>

            {/* Username / Password */}
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
                    placeholder={usernamePlaceholder}
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

            {/* SSL */}
            {config.type === 'postgres' && (
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

            {/* Actions */}
            <div className="flex space-x-4 pt-4">
              <button
                  type="submit"
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
                    if (!validateForm()) return;
                    alert('Form looks valid. The actual connection happens on Connect.');
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
