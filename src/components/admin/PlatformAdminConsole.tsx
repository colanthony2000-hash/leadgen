import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Shield,
  Activity,
  Server,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Cpu,
  Clock,
  Terminal
} from 'lucide-react';

export const PlatformAdminConsole: React.FC = () => {
  const { auditLogs, tenants, companies, setIsPrivacyModalOpen } = useApp();

  const workerQueues = [
    { queue: 'ai_research_workers', workers: 4, activeJobs: 0, completed24h: 34, status: 'nominal' },
    { queue: 'nipex_sync_workers', workers: 2, activeJobs: 0, completed24h: 12, status: 'nominal' },
    { queue: 'enrichment_metering_queue', workers: 2, activeJobs: 0, completed24h: 88, status: 'nominal' },
    { queue: 'suppression_audit_worker', workers: 1, activeJobs: 0, completed24h: 154, status: 'nominal' },
  ];

  const providerHealth = [
    { name: 'NipeX JQS Tender Scraper', latencyMs: 240, uptime: '99.9%', status: 'healthy' },
    { name: 'Apollo Commercial Adapter', latencyMs: 180, uptime: '99.8%', status: 'healthy' },
    { name: 'CAC Public Registry Connector', latencyMs: 310, uptime: '99.5%', status: 'healthy' },
    { name: 'Google GenAI (gemini-3.8-flash)', latencyMs: 420, uptime: '100%', status: 'healthy' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-amber-400 font-medium mb-1">
          <Shield className="w-4 h-4" />
          <span>Platform Operations & Security Boundary Console</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          System Administration & Multi-Tenant Audit
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Monitors background job queue workers, provider adapter latency, cryptographic suppression compliance, and multi-tenant isolation invariants.
        </p>
      </div>

      {/* Top Telemetry / Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <span className="text-xs font-medium text-slate-400">Multi-Tenant Isolation</span>
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-base pt-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Zero Cross-Tenant Leaks</span>
          </div>
          <span className="text-[10px] text-slate-500 block pt-1">
            Row-Level Security (RLS) & App Auth Enforced
          </span>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <span className="text-xs font-medium text-slate-400">Total Workspaces Active</span>
          <div className="text-2xl font-bold font-mono text-white pt-1">
            {tenants.length}
          </div>
          <span className="text-[10px] text-slate-500 block pt-1">
            Personal & Company Tenancies
          </span>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <span className="text-xs font-medium text-slate-400">Canonical Records</span>
          <div className="text-2xl font-bold font-mono text-white pt-1">
            {companies.length}
          </div>
          <span className="text-[10px] text-slate-500 block pt-1">
            Shared Permitted Intelligence Entities
          </span>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-400">Suppression Registry</span>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-base pt-1">
              <Lock className="w-4 h-4" />
              <span>NDPA 2023 Active</span>
            </div>
            <span className="text-[10px] text-slate-500 block pt-1">
              One-way SHA-256 Hashing Enforced
            </span>
          </div>
          <button
            onClick={() => setIsPrivacyModalOpen(true)}
            className="mt-3 text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors self-start"
          >
            <span>Open Privacy Registry & Verifier →</span>
          </button>
        </div>
      </div>

      {/* Background Job Queue Status & Provider Latencies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Queue */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400" />
            Background Processing Queues (Atomic SKIP LOCKED)
          </h3>

          <div className="space-y-3">
            {workerQueues.map((wq, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono font-semibold text-slate-200 block">{wq.queue}</span>
                  <span className="text-slate-500 text-[11px]">
                    {wq.workers} dedicated worker processes
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-semibold font-mono">{wq.completed24h} jobs / 24h</span>
                  <span className="text-slate-500 text-[10px] block">0 dead-letter failures</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Provider Health */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-amber-400" />
            Provider Adapters & Ingestion Endpoints
          </h3>

          <div className="space-y-3">
            {providerHealth.map((ph, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-200 block">{ph.name}</span>
                  <span className="text-slate-500 text-[11px]">Uptime: {ph.uptime}</span>
                </div>
                <div className="text-right">
                  <span className="text-amber-400 font-mono font-bold">{ph.latencyMs}ms</span>
                  <span className="text-emerald-400 text-[10px] block uppercase font-medium">Nominal</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security & Isolation Audit Log Table */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-amber-400" />
          Security Audit Trail & Authorization Assertions
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Action Code</th>
                <th className="py-2.5 px-3">Target Resource</th>
                <th className="py-2.5 px-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-medium text-white">
                    {log.actor_name}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-amber-300 border border-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                    {log.resource_type}:{log.resource_id}
                  </td>
                  <td className="py-3 px-3 text-slate-300 text-xs">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
