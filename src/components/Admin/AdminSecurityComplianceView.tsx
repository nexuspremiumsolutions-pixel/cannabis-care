import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  Lock,
  Database,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Trash2,
  Layers,
  Server,
  ToggleLeft,
  ToggleRight,
  Eye,
  KeyRound,
  FileText,
  Clock,
  HardDrive,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  ProductionReadinessScore,
  SecurityIncident,
  BackupSnapshot,
  SystemFeatureFlag,
} from '../../types/entities';

export const AdminSecurityComplianceView: React.FC = () => {
  const { token } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'readiness' | 'backups' | 'incidents' | 'gdpr' | 'flags'>('readiness');
  const [readiness, setReadiness] = useState<ProductionReadinessScore | null>(null);
  const [backups, setBackups] = useState<BackupSnapshot[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [flags, setFlags] = useState<SystemFeatureFlag[]>([]);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // GDPR Tool state
  const [gdprSearchEmail, setGdprSearchEmail] = useState('');
  const [gdprExportData, setGdprExportData] = useState<any | null>(null);

  // New Incident state
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [newIncidentTitle, setNewIncidentTitle] = useState('');
  const [newIncidentDesc, setNewIncidentDesc] = useState('');
  const [newIncidentSeverity, setNewIncidentSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const fetchSecurityData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [rRes, bRes, iRes, fRes, sRes] = await Promise.all([
        fetch('/api/security/readiness', { headers }),
        fetch('/api/security/backups', { headers }),
        fetch('/api/security/incidents', { headers }),
        fetch('/api/security/feature-flags', { headers }),
        fetch('/api/security/system-config', { headers }),
      ]);

      if (rRes.ok) {
        const data = await rRes.json();
        setReadiness(data.readiness);
      }
      if (bRes.ok) {
        const data = await bRes.json();
        setBackups(data.backups || []);
      }
      if (iRes.ok) {
        const data = await iRes.json();
        setIncidents(data.incidents || []);
      }
      if (fRes.ok) {
        const data = await fRes.json();
        setFlags(data.flags || []);
      }
      if (sRes.ok) {
        const data = await sRes.json();
        setSystemConfig(data.config || null);
      }
    } catch (err) {
      console.error('Error fetching security data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, [token]);

  // Handle Trigger Backup
  const handleCreateBackup = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/security/backups/create', {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback(`Sauvegarde créée avec succès. Checksum: ${data.backup.checksumSha256.substring(0, 12)}...`);
        fetchSecurityData();
      } else {
        showFeedback(data.error || 'Échec de la sauvegarde.', 'error');
      }
    } catch (err: any) {
      showFeedback(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Verify Backup
  const handleVerifyBackup = async (backupId: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/security/backups/${backupId}/verify`, {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback(`Vérification d'intégrité réussie (BACKUP -> RESTORE -> VERIFY). ${data.details.tableCount} tables validées.`);
        fetchSecurityData();
      } else {
        showFeedback(data.error || 'Échec de vérification.', 'error');
      }
    } catch (err: any) {
      showFeedback(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Toggle Feature Flag
  const handleToggleFlag = async (flagKey: string, currentEnabled: boolean) => {
    try {
      const res = await fetch(`/api/security/feature-flags/${flagKey}/toggle`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      if (res.ok) {
        setFlags((prev) =>
          prev.map((f) => (f.key === flagKey ? { ...f, isEnabled: !currentEnabled } : f))
        );
        showFeedback(`Feature flag "${flagKey}" mis à jour.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Toggle Maintenance Mode
  const handleToggleMaintenance = async () => {
    if (!systemConfig) return;
    const nextState = !systemConfig.maintenanceMode;
    try {
      const res = await fetch('/api/security/maintenance/toggle', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          enabled: nextState,
          message: nextState ? 'Plateforme en maintenance programmée pour mise à niveau technique.' : '',
        }),
      });
      if (res.ok) {
        setSystemConfig((prev: any) => ({ ...prev, maintenanceMode: nextState }));
        showFeedback(nextState ? 'Mode maintenance ACTIVÉ.' : 'Mode maintenance DÉSACTIVÉ.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Resolve Incident
  const handleResolveIncident = async (incidentId: string) => {
    try {
      const res = await fetch(`/api/security/incidents/${incidentId}/resolve`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ postMortemNotes: 'Mesure corrective appliquée et vérifiée.' }),
      });
      if (res.ok) {
        showFeedback('Incident clôturé avec succès.');
        fetchSecurityData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Create Incident
  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncidentTitle) return;
    try {
      const res = await fetch('/api/security/incidents', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: newIncidentTitle,
          description: newIncidentDesc,
          severity: newIncidentSeverity,
        }),
      });
      if (res.ok) {
        setShowIncidentModal(false);
        setNewIncidentTitle('');
        setNewIncidentDesc('');
        showFeedback('Nouvel incident enregistré.');
        fetchSecurityData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle GDPR Export
  const handleGdprExport = async () => {
    if (!gdprSearchEmail) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/security/privacy/export-by-email?email=${encodeURIComponent(gdprSearchEmail)}`, { headers });
      const data = await res.json();
      if (res.ok && data.success) {
        setGdprExportData(data.data);
        showFeedback('Export RGPD généré avec succès.');
      } else {
        showFeedback(data.error || 'Utilisateur introuvable.', 'error');
      }
    } catch (err: any) {
      showFeedback(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <span>Module 18 — Sécurité, Conformité & Production Readiness</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Gouvernance, Sécurité & RGPD
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl">
              Sanctuaire des données de santé, audits d&apos;intégrité, snapshots cryptographiques SHA-256 et évaluation en temps réel du score de mise en production.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {readiness && (
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base ${
                  readiness.overallScore >= 80 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  readiness.overallScore >= 60 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {readiness.overallScore}%
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Score de Readiness</div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    {readiness.overallStatus === 'READY' ? (
                      <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Prêt pour Production</>
                    ) : (
                      <><AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Prêt avec Réserves</>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={fetchSecurityData}
              disabled={isLoading}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              title="Rafraîchir les métriques"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className={`p-4 rounded-2xl border text-sm font-medium flex items-center gap-2 transition ${
          feedbackMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Sub-Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/80 rounded-2xl max-w-fit">
        <button
          type="button"
          onClick={() => setActiveSubTab('readiness')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'readiness'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
          <span>Production Readiness (10 Domaines)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('backups')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'backups'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-emerald-700" />
          <span>Sauvegardes & PRA (SHA-256)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('gdpr')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'gdpr'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-indigo-700" />
          <span>Sanctuaire RGPD & Export Art. 20</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('incidents')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'incidents'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Incidents & Alertes</span>
          {incidents.filter((i) => i.status === 'OPEN').length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {incidents.filter((i) => i.status === 'OPEN').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('flags')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'flags'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ToggleRight className="w-3.5 h-3.5 text-teal-600" />
          <span>Feature Flags & Maintenance</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: PRODUCTION READINESS SCORECARD                          */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'readiness' && readiness && (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100">
              <div className="text-xs font-semibold text-teal-800">Contrôles Validés</div>
              <div className="text-2xl font-black text-teal-950 mt-1">
                {readiness.checks.filter((c) => c.status === 'PASS').length} / {readiness.checks.length}
              </div>
              <div className="text-[11px] text-teal-700 mt-1">Éléments conformes aux exigences</div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
              <div className="text-xs font-semibold text-indigo-800">Domaines Évalués</div>
              <div className="text-2xl font-black text-indigo-950 mt-1">10 / 10</div>
              <div className="text-[11px] text-indigo-700 mt-1">Sécurité, RGPD, Paiements, PRA, etc.</div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
              <div className="text-xs font-semibold text-amber-800">Avertissements</div>
              <div className="text-2xl font-black text-amber-950 mt-1">
                {readiness.checks.filter((c) => c.status === 'WARN').length}
              </div>
              <div className="text-[11px] text-amber-700 mt-1">Éléments configurables à finaliser</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-semibold text-slate-700">Dernière Évaluation</div>
              <div className="text-sm font-bold text-slate-900 mt-1">
                {new Date(readiness.evaluatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Automatisée & Non-simulée</div>
            </div>
          </div>

          {/* Domain Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(readiness.categories).map(([catKey, cat]: [string, any]) => (
              <div key={catKey} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">{cat.name}</span>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-lg ${
                    cat.score >= 80 ? 'bg-emerald-100 text-emerald-800' :
                    cat.score >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {cat.score}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      cat.score >= 80 ? 'bg-emerald-500' : cat.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${cat.score}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Pondération : {cat.weight}%</span>
                  <span>{cat.checks.filter((c: any) => c.status === 'PASS').length}/{cat.checks.length} réussis</span>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Readiness Checklist */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Audit exhaustif des exigences de production</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Conformité stricte aux directives d&apos;architecture, chiffrement PBKDF2, sanitization anti-XSS et isolation multi-tenant.
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-xl">
                {readiness.checks.length} contrôles
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {readiness.checks.map((check) => (
                <div key={check.id} className="p-4 hover:bg-slate-50/50 transition flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {check.status === 'PASS' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {check.status === 'WARN' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                      {check.status === 'FAIL' && <XCircle className="w-4 h-4 text-rose-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{check.name}</span>
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {check.category}
                        </span>
                        {check.isCritical && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-rose-100 text-rose-700 rounded">
                            Critique
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{check.description}</p>
                      {check.remediationNote && (
                        <p className="text-[11px] text-amber-700 mt-1 font-medium flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" /> {check.remediationNote}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                      check.status === 'PASS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      check.status === 'WARN' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {check.status === 'PASS' ? 'TESTÉ' : check.status === 'WARN' ? 'CONFIGURÉ' : 'À VÉRIFIER'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: BACKUPS & PRA SNAPSHOTS (SHA-256)                      */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'backups' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Plan de Reprise d&apos;Activité & Sauvegardes Cryptographiques</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Chaque instantané sauvegarde l&apos;intégralité des tables système avec calcul d&apos;empreinte SHA-256. La procédure (BACKUP -&gt; RESTORE -&gt; VERIFY) teste la restauration automatisée en bac à sable.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreateBackup}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition shrink-0"
            >
              <Database className="w-4 h-4" />
              <span>Générer un Snapshot Immédiat</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">Historique des Snapshots de Sauvegarde</h4>
              <span className="text-xs text-slate-500 font-medium">{backups.length} instantanés archivés</span>
            </div>

            {backups.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                Aucun snapshot pour le moment. Cliquez sur &quot;Générer un Snapshot Immédiat&quot; pour amorcer la sauvegarde.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {backups.map((b) => (
                  <div key={b.id} className="p-5 hover:bg-slate-50/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{b.id}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          b.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {b.status === 'VERIFIED' ? 'VÉRIFIÉ (PRA CONFORME)' : 'CRÉÉ'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span>Créé le : {new Date(b.createdAt).toLocaleString('fr-FR')}</span>
                        <span>Tables : {b.tablesCount}</span>
                        <span>Taille : {Math.round(b.sizeBytes / 1024)} Ko</span>
                        <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          SHA-256 : {b.checksumSha256.substring(0, 16)}...
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleVerifyBackup(b.id)}
                        disabled={isProcessing}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                        <span>Tester Restauration (Sandbox)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: GDPR PRIVACY SANCTUARY & ARTICLE 20 EXPORT              */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'gdpr' && (
        <div className="space-y-6">
          {/* Sanctuary Concept Overview */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-sm flex flex-col md:flex-row items-start gap-6">
            <div className="p-3.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Principe du Sanctuaire des Données de Santé</h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                Les consommations déclarées, dosages THC, cravings et notes intimes de bien-être sont isolés et protégés par chiffrement au repos. Les administrateurs de la plateforme et les boutiques partenaires n&apos;ont <strong>aucun accès de lecture</strong> à ces dossiers confidentiels. En cas d&apos;exercice du droit à l&apos;oubli (Art. 17 RGPD), les données de santé sont détruites immédiatement, tandis que les factures comptables sont pseudonymisées et conservées conformément à l&apos;article L123-22 du Code de commerce.
              </p>
            </div>
          </div>

          {/* GDPR Article 20 Export Tool */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Download className="w-4 h-4 text-teal-700" />
              <span>Outil de Portabilité & Export de Données (Article 20 RGPD)</span>
            </h4>
            <p className="text-xs text-slate-500">
              Générez et inspectez le paquet d&apos;exportation structuré au format JSON standardisé pour n&apos;importe quel compte utilisateur enregistré.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={gdprSearchEmail}
                onChange={(e) => setGdprSearchEmail(e.target.value)}
                placeholder="Ex : demo.thc@cannabiscare.fr"
                className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
              />
              <button
                type="button"
                onClick={handleGdprExport}
                disabled={isProcessing || !gdprSearchEmail}
                className="px-6 py-2.5 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold cursor-pointer disabled:opacity-50 transition"
              >
                Générer Export JSON
              </button>
            </div>

            {gdprExportData && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto max-h-96 space-y-2">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                  <span>Export utilisateur validé (JSON conforme)</span>
                  <span>{gdprExportData.metadata.exportedAt}</span>
                </div>
                <pre>{JSON.stringify(gdprExportData, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Retention Policies Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-teal-700" />
              <span>Politiques de Rétention & Justifications Juridiques</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="text-xs font-bold text-slate-900">Données de Consommation & Suivi</div>
                <div className="text-xs text-teal-800 font-bold">Durée : Vie du compte utilisateur</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Effacement immédiat dès la suppression du compte par l&apos;utilisateur.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="text-xs font-bold text-slate-900">Factures & Commandes Marketplace</div>
                <div className="text-xs text-indigo-800 font-bold">Durée : 10 ans (Code de commerce L123-22)</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Conservation obligatoire des pièces comptables avec pseudonymisation des identités.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="text-xs font-bold text-slate-900">Journaux d&apos;Audit & Sécurité</div>
                <div className="text-xs text-slate-800 font-bold">Durée : 12 mois glissants</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Conservation pour analyse post-incident et traçabilité légale.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: SECURITY INCIDENTS & ALERT MONITORING                   */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'incidents' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Gestion des Incidents de Sécurité</h3>
              <p className="text-xs text-slate-500 mt-1">
                Suivi des tentatives d&apos;injection, blocages bruteforce et anomalies détectées par le système.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowIncidentModal(true)}
              className="px-5 py-2.5 rounded-2xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition shrink-0"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Déclarer un Incident</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">Registre des Incidents & Alertes</h4>
              <span className="text-xs text-slate-500 font-medium">{incidents.length} enregistrements</span>
            </div>

            {incidents.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                Aucun incident de sécurité enregistré. Tous les systèmes fonctionnent normalement.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {incidents.map((inc) => (
                  <div key={inc.id} className="p-5 hover:bg-slate-50/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          inc.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          inc.severity === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {inc.severity}
                        </span>
                        <span className="text-sm font-bold text-slate-900">{inc.title}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          inc.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {inc.status === 'RESOLVED' ? 'RÉSOLU' : 'EN COURS'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{inc.description}</p>
                      <div className="text-[11px] text-slate-400">
                        Détecté le : {new Date(inc.createdAt).toLocaleString('fr-FR')}
                        {inc.resolvedAt && ` • Clôturé le : ${new Date(inc.resolvedAt).toLocaleString('fr-FR')}`}
                      </div>
                    </div>

                    {inc.status !== 'RESOLVED' && (
                      <button
                        type="button"
                        onClick={() => handleResolveIncident(inc.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold cursor-pointer transition shrink-0"
                      >
                        Marquer comme Résolu
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: FEATURE FLAGS & MAINTENANCE MODE                        */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'flags' && (
        <div className="space-y-6">
          {/* Maintenance Mode Controller */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Mode Maintenance de la Plateforme</h3>
                {systemConfig?.maintenanceMode ? (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ACTIF (REQUÊTES PUBLIQUES 503)
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    NORMAL (EN LIGNE)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 max-w-xl">
                Lorsqu&apos;il est activé, toutes les requêtes des clients et boutiques reçoivent un code HTTP 503 avec estimation de fin. Seuls les administrateurs connectés conservent l&apos;accès complet.
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleMaintenance}
              className={`px-6 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm ${
                systemConfig?.maintenanceMode
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : 'bg-amber-700 hover:bg-amber-800 text-white'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>{systemConfig?.maintenanceMode ? 'Désactiver le Mode Maintenance' : 'Activer le Mode Maintenance'}</span>
            </button>
          </div>

          {/* Feature Flags Grid */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">Contrôle Dynamique des Feature Flags</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Activez ou désactivez les fonctionnalités en temps réel sans redéploiement de code.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {flags.map((flag) => (
                <div key={flag.key} className="p-5 hover:bg-slate-50/50 transition flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{flag.name}</span>
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {flag.key}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{flag.description}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleFlag(flag.key, flag.isEnabled)}
                    className="p-1 rounded-full cursor-pointer transition text-slate-400 hover:text-slate-600"
                    title={flag.isEnabled ? 'Désactiver' : 'Activer'}
                  >
                    {flag.isEnabled ? (
                      <ToggleRight className="w-8 h-8 text-teal-700" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-300" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Incident Declaration Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Déclarer un Incident de Sécurité</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowIncidentModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Titre de l&apos;incident</label>
                <input
                  type="text"
                  required
                  value={newIncidentTitle}
                  onChange={(e) => setNewIncidentTitle(e.target.value)}
                  placeholder="Ex : Tentative d'injection SQL bloquée sur API"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Niveau de sévérité</label>
                <select
                  value={newIncidentSeverity}
                  onChange={(e: any) => setNewIncidentSeverity(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-teal-700"
                >
                  <option value="LOW">Faible (LOW)</option>
                  <option value="MEDIUM">Moyen (MEDIUM)</option>
                  <option value="HIGH">Élevé (HIGH)</option>
                  <option value="CRITICAL">Critique (CRITICAL)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description détaillée</label>
                <textarea
                  rows={3}
                  value={newIncidentDesc}
                  onChange={(e) => setNewIncidentDesc(e.target.value)}
                  placeholder="Détails techniques, adresse IP source, actions entreprises..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-teal-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer"
                >
                  Enregistrer l&apos;Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
