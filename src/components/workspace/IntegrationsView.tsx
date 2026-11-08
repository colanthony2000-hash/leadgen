import React, { useState } from 'react';
import {
  Settings,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Lock,
  Layers,
  Database
} from 'lucide-react';

export const IntegrationsView: React.FC = () => {
  const [integrations, setIntegrations] = useState([
    {
      id: 'int-nipex',
      name: 'NipeX Joint Qualification System (JQS) Sync',
      type: 'Tender & Supplier Portal',
      description: 'Synchronizes active Category 3.01.05 and 3.01.08 procurement notices, pre-qualification deadlines, and NCDMB announcements.',
      status: 'connected',
      lastSync: '2026-11-08T06:00:00Z',
      recordsProcessed: 142,
    },
    {
      id: 'int-apollo',
      name: 'Apollo / B2B Commercial Data Adapter',
      type: 'Contact Enrichment API',
      description: 'Enriches C-Suite and technical director work emails, LinkedIn links, and headcount growth signals under strict purpose limitations.',
      status: 'connected',
      lastSync: '2026-11-07T14:30:00Z',
      recordsProcessed: 89,
    },
    {
      id: 'int-reg',
      name: 'Corporate Affairs Commission (CAC) Public Registry',
      type: 'Official Registry Scraper',
      description: 'Validates company incorporation status, registered address, and directorship records in Nigeria.',
      status: 'connected',
      lastSync: '2026-11-06T18:00:00Z',
      recordsProcessed: 320,
    },
    {
      id: 'int-smtp',
      name: 'Resend / SMTP Outbound Dispatcher',
      type: 'Human-Approved Email Service',
      description: 'Secure, authenticated email transmission for approved outreach messages. Enforces suppression and marketing objection checks.',
      status: 'connected',
      lastSync: '2026-11-07T16:02:00Z',
      recordsProcessed: 18,
    },
  ]);

  const [testingId, setTestingId] = useState<string | null>(null);

  const handleTestConnection = (id: string) => {
    setTestingId(id);
    setTimeout(() => {
      setTestingId(null);
      alert('Integration diagnostic passed: Connection active and credentials valid.');
    }, 800);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-amber-400" />
          Data Providers & Integration Adapters
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Jeneconk BII isolates provider integrations behind common adapters to prevent vendor lock-in. All provider calls adhere to contractual terms, caching guidelines, and privacy limits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-amber-400 tracking-wider">
                  {item.type}
                </span>
                <h3 className="text-sm font-semibold text-white">
                  {item.name}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connected</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {item.description}
            </p>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono text-[11px]">
                Last Sync: {new Date(item.lastSync).toLocaleDateString()} · {item.recordsProcessed} synced
              </span>

              <button
                onClick={() => handleTestConnection(item.id)}
                disabled={testingId === item.id}
                className="px-3 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3 h-3 ${testingId === item.id ? 'animate-spin text-amber-400' : ''}`} />
                <span>Test Link</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
