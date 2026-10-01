import React from 'react';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { Database, Cloud, Cpu, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  const containerName = import.meta.env.VITE_AZURE_CONTAINER_NAME || 'research-documents';

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-canvas">
      <Header
        title="Settings & System Architecture"
        subtitle="Backend service connections, storage endpoints, and configuration"
      />

      <PageContainer className="space-y-6 max-w-4xl">
        {/* User Card */}
        <div className="bg-white rounded-lg border border-stone-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-900 uppercase font-mono tracking-wider">
            <User className="w-4 h-4 text-stone-600" />
            <span>Active Research Identity</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[11px] text-stone-500">Name</label>
              <div className="font-medium text-stone-800">{user?.name || '—'}</div>
            </div>
            <div>
              <label className="text-[11px] text-stone-500">Email</label>
              <div className="font-medium text-stone-800">{user?.email || '—'}</div>
            </div>
          </div>
        </div>

        {/* System Connections */}
        <div className="bg-white rounded-lg border border-stone-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-900 uppercase font-mono tracking-wider">
            <Cpu className="w-4 h-4 text-stone-600" />
            <span>Service Topology</span>
          </div>

          <div className="space-y-3 divide-y divide-stone-100 text-xs">
            <div className="pt-2 flex items-center justify-between">
              <div>
                <div className="font-medium text-stone-800">Backend REST API</div>
                <div className="text-[11px] text-stone-500">Spring Boot 3.3.4 · Java 21</div>
              </div>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                {apiUrl}
              </span>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-stone-800">Document Storage</div>
                <div className="text-[11px] text-stone-500">Azure Blob Storage · Container: {containerName}</div>
              </div>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Connected
              </span>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-stone-800">Metadata & History</div>
                <div className="text-[11px] text-stone-500">PostgreSQL · JPA / Hibernate ORM</div>
              </div>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                PostgreSQL
              </span>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-stone-800">AI / RAG Service</div>
                <div className="text-[11px] text-stone-500">FastAPI · Hugging Face · Semantic Vector Search</div>
              </div>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                POST /ai/query
              </span>
            </div>
          </div>
        </div>

        {/* Security & Access */}
        <div className="bg-white rounded-lg border border-stone-200/80 p-5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-900 uppercase font-mono tracking-wider">
            <ShieldCheck className="w-4 h-4 text-stone-600" />
            <span>Security</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            All cloud credentials and API keys are managed server-side inside Spring Boot configuration.
            The frontend communicates exclusively via JWT-authenticated REST endpoints and never receives
            or stores cloud tokens.
          </p>
        </div>
      </PageContainer>
    </div>
  );
};
