import { Head, router } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Users, CheckCircle, Clock, AlertTriangle, Plus, Send, Trash2, Eye, Pencil } from 'lucide-react';
import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GestorProvider, useGestor } from '@/context/GestorContext';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { ClientDetailModal } from '@/components/clients/ClientDetailModal';
import type{ ClientWithStatus } from '@/types/client';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: dashboard().url,
  },
];

const statusLabels: Record<string, string> = { active: 'Activo', near_expiry: 'Próximo a vencer', expired: 'Vencido' };
const statusClasses: Record<string, string> = { active: 'status-active', near_expiry: 'status-near-expiry', expired: 'status-expired' };

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

type DashboardStats = {
  total: number;
  active: number;
  near_expiry: number;
  expired: number;
};

type DashboardIncome = {
  period: 'weekly' | 'monthly' | 'annual';
  total: number;
  chart: Array<{ date: string; amount: number }>;
};

type DashboardAlert = {
  id: string;
  name: string;
  phone: string;
  plan: string;
  speed: string;
  monthlyAmount: number;
  nextPaymentDate: string;
  status: 'near_expiry' | 'expired' | 'active';
  daysUntilDue: number;
};

function DashboardContent({
  backendStats,
  backendIncome,
  backendAlerts,
  backendAlertsTotal,
  backendNotes,
}: {
  backendStats?: DashboardStats;
  backendIncome?: DashboardIncome;
  backendAlerts?: DashboardAlert[];
  backendAlertsTotal?: number;
  backendNotes?: Array<{ id: string; content: string; date: string }>;
}) {
  const { clients, stats } = useGestor();
  const [noteText, setNoteText] = useState('');
  const [detailClient, setDetailClient] = useState<ClientWithStatus | null>(null);
  const [incomePeriod, setIncomePeriod] = useState<'weekly' | 'monthly' | 'annual'>(backendIncome?.period ?? 'monthly');
  const [notes, setNotes] = useState<Array<{ id: string; content: string; date: string }>>(backendNotes ?? []);
  const [notePreview, setNotePreview] = useState<{ content: string; date: string } | null>(null);
  const [editingNote, setEditingNote] = useState<{ id: string; content: string } | null>(null);
  const [editText, setEditText] = useState('');
  const alerts = backendAlerts ?? [];
  const alertsTotal = backendAlertsTotal ?? alerts.length;
  const topStats = {
    total: backendStats?.total ?? stats.total,
    active: backendStats?.active ?? stats.active,
    nearExpiry: backendStats?.near_expiry ?? stats.nearExpiry,
    expired: backendStats?.expired ?? stats.expired,
  };

  const pieData = [
    { name: 'Activos', value: topStats.active },
    { name: 'Próximos', value: topStats.nearExpiry },
    { name: 'Vencidos', value: topStats.expired },
  ];

  const incomeData = backendIncome ?? { period: incomePeriod, total: 0, chart: [] };

  const handleIncomePeriodChange = (period: 'weekly' | 'monthly' | 'annual') => {
    setIncomePeriod(period);
    router.get(
      dashboard().url,
      { period },
      { preserveState: true, preserveScroll: true, replace: true },
    );
  };

  const sendWhatsApp = (client: DashboardAlert) => {
    const msg = `Hola ${client.name}, le recordamos que su servicio de internet (${client.plan} - ${client.speed}) tiene fecha de pago próxima. Monto: S/ ${client.monthlyAmount.toFixed(2)}. Gracias por su preferencia - GESEM`;
    window.open(`https://wa.me/51${client.phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const readCsrf = () => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

  const createNote = async () => {
    const content = noteText.trim();
    if (!content) return;

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': readCsrf(),
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) return;
      const payload = (await response.json()) as { data: { id: string; content: string; date: string } };
      if (!payload?.data) return;
      setNotes((prev) => [payload.data, ...prev]);
      setNoteText('');
    } catch (error) {
      console.error('No se pudo crear la nota', error);
    }
  };

  const removeNote = async (id: string) => {
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'X-CSRF-TOKEN': readCsrf(),
        },
      });
      if (!response.ok) return;
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('No se pudo eliminar la nota', error);
    }
  };

  const startEditNote = (note: { id: string; content: string }) => {
    setEditingNote(note);
    setEditText(note.content);
  };

  const saveEditNote = async () => {
    if (!editingNote) return;
    const content = editText.trim();
    if (!content) return;

    try {
      const response = await fetch(`/api/notes/${editingNote.id}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': readCsrf(),
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) return;
      const payload = (await response.json()) as { data: { id: string; content: string; date: string } };
      if (!payload?.data) return;
      setNotes((prev) => prev.map((n) => (n.id === payload.data.id ? payload.data : n)));
      setEditingNote(null);
      setEditText('');
    } catch (error) {
      console.error('No se pudo editar la nota', error);
    }
  };

  const statCards = [
    { label: 'Total Clientes', value: topStats.total, icon: Users, color: 'bg-primary/10 text-primary' },
    { label: 'Activos', value: topStats.active, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Próximos a vencer', value: topStats.nearExpiry, icon: Clock, color: 'bg-amber-50 text-amber-600' },
    { label: 'Vencidos', value: topStats.expired, icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
  ];
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      <div className="page-containe flex flex-col gap-6 p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="stat-card"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pie Chart */}
          <div className="stat-card">
            <h3 className="text-sm font-semibold mb-4">Estado de Clientes</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-muted-foreground">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Income Chart */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Ingresos</h3>
              <div className="flex gap-1">
                {(['weekly', 'monthly', 'annual'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => handleIncomePeriodChange(p)}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                      incomePeriod === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {p === 'weekly' ? 'Semanal' : p === 'monthly' ? 'Mensual' : 'Anual'}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-2xl font-bold mb-3">S/ {incomeData.total.toFixed(2)}</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeData.chart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(220,13%,91%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(220,10%,46%)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(220,10%,46%)" />
                  <Tooltip />
                  <Bar dataKey="amount" fill="hsl(24,95%,53%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Alerts + Notes Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Alerts */}
          <div className="stat-card">
            <h3 className="text-sm font-semibold mb-3">Alertas ({alertsTotal})</h3>
            <div className="space-y-2 max-h-64 overflow-auto">
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sin alertas pendientes</p>
              ) : (
                alerts.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{a.name}</p>
                        <Badge className={`${statusClasses[a.status]} border text-xs flex-shrink-0`}>
                          {a.daysUntilDue === 0 ? 'Hoy' : a.daysUntilDue > 0 ? `${a.daysUntilDue}d` : `${Math.abs(a.daysUntilDue)}d atrás`}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {a.plan} – {a.speed} – S/ {a.monthlyAmount.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => sendWhatsApp(a)}
                      className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors flex-shrink-0"
                      title="Enviar WhatsApp"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="stat-card">
            <h3 className="text-sm font-semibold mb-3">Notas</h3>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Agregar nota..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && noteText.trim()) {
                    void createNote();
                  }
                }}
                className="h-9 text-sm"
              />
              <Button
                size="sm"
                onClick={() => { void createNote(); }}
                disabled={!noteText.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-auto">
              {notes.map(n => (
                <div key={n.id} className="flex items-start justify-between p-2.5 rounded-lg bg-muted/50 gap-2">
                  <div className="min-w-0 flex-1">
                    <button onClick={() => setNotePreview({ content: n.content, date: n.date })} className="w-full text-left">
                      <p className="text-sm truncate">{n.content}</p>
                    </button>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.date}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEditNote(n)} className="p-1 text-muted-foreground hover:text-primary">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { void removeNote(n.id); }} className="p-1 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Client Table */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Clientes Recientes</h3>
            <Button size="sm" variant="outline" onClick={() => router.get('/clients')}>Ver todos</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Plan</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Monto</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">Estado</th>
                  <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground">Acción</th>
                </tr>
              </thead>
              <tbody>
                {clients.slice(0, 5).map(c => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </td>
                    <td className="py-2.5 px-3 hidden sm:table-cell text-muted-foreground">{c.plan}</td>
                    <td className="py-2.5 px-3 hidden md:table-cell">S/ {c.monthlyAmount.toFixed(2)}</td>
                    <td className="py-2.5 px-3">
                      <Badge className={`${statusClasses[c.status]} border text-xs`}>
                        {statusLabels[c.status]}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button onClick={() => setDetailClient(c)} className="p-1.5 rounded-md hover:bg-muted">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <ClientDetailModal open={!!detailClient} onClose={() => setDetailClient(null)} client={detailClient} />

        <Dialog open={!!notePreview} onOpenChange={(v) => { if (!v) setNotePreview(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalle de Nota</DialogTitle>
            </DialogHeader>
            <p className="text-sm whitespace-pre-wrap">{notePreview?.content}</p>
            <p className="text-xs text-muted-foreground">{notePreview?.date}</p>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingNote} onOpenChange={(v) => { if (!v) setEditingNote(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Nota</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input value={editText} onChange={(e) => setEditText(e.target.value)} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingNote(null)}>Cancelar</Button>
                <Button onClick={() => { void saveEditNote(); }} disabled={!editText.trim()}>Guardar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

export default function Dashboard({
  backendData,
}: {
  backendData?: {
    stats?: DashboardStats;
    income?: DashboardIncome;
    alerts?: DashboardAlert[];
    alerts_total?: number;
    notes?: Array<{ id: string; content: string; date: string }>;
  };
}) {
  return (
    <GestorProvider>
      <DashboardContent
        backendStats={backendData?.stats}
        backendIncome={backendData?.income}
        backendAlerts={backendData?.alerts}
        backendAlertsTotal={backendData?.alerts_total}
        backendNotes={backendData?.notes}
      />
    </GestorProvider>
  );
}


