import { Head } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, MessageCircle, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type NotificationAlert = {
  id: string;
  name: string;
  phone: string;
  plan: string;
  speed: string;
  monthlyAmount: number;
  nextPaymentDate: string;
  status: 'near_expiry' | 'expired';
  daysUntilDue: number;
};

type AlertsResponse = {
  data: NotificationAlert[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Notificaciones', href: '/notificaciones' },
];

const statusMeta = {
  near_expiry: {
    badgeClass: 'status-near-expiry',
    iconWrap: 'bg-amber-50 text-amber-700',
    icon: Clock,
  },
  expired: {
    badgeClass: 'status-expired',
    iconWrap: 'bg-red-50 text-red-700',
    icon: AlertTriangle,
  },
} as const;

function InfoChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] text-foreground/80">
      {children}
    </span>
  );
}

function NotificationsContent() {
  const [alerts, setAlerts] = useState<NotificationAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const readCsrf = () => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

  const fetchAlerts = async (targetPage: number, append: boolean) => {
    const response = await fetch(`/api/notifications/alerts?page=${targetPage}&per_page=15`, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return;
    const payload = (await response.json()) as AlertsResponse;
    const rows = payload.data ?? [];

    setAlerts((prev) => (append ? [...prev, ...rows] : rows));
    const current = payload.meta?.current_page ?? targetPage;
    const last = payload.meta?.last_page ?? targetPage;
    setPage(current);
    setHasMore(current < last);
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        await fetchAlerts(1, false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      void fetchAlerts(1, false);
    }, 30000);

    return () => window.clearInterval(id);
  }, []);

  const sendNotification = async (client: NotificationAlert, channel: 'whatsapp' | 'sms', message: string) => {
    try {
      await fetch('/api/notifications/send', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': readCsrf(),
        },
        body: JSON.stringify({
          client_id: Number(client.id),
          channel,
          status: client.status,
          message,
        }),
      });
    } catch (error) {
      console.error('No se pudo registrar envío de notificación', error);
    }
  };

  const sendWhatsApp = (client: NotificationAlert) => {
    const msg =
      client.status === 'expired'
        ? `Hola ${client.name}, le informamos que su servicio de internet (${client.plan}) ha vencido. Su pago de S/ ${client.monthlyAmount.toFixed(
            2,
          )} está pendiente. Por favor regularice su situación para evitar la suspensión. - GESEM`
        : `Hola ${client.name}, le recordamos que su servicio de internet (${client.plan} - ${
            client.speed
          }) vence el ${format(parseISO(client.nextPaymentDate), 'dd/MM/yyyy')}. Monto: S/ ${client.monthlyAmount.toFixed(2)}. Gracias - GESEM`;

    void sendNotification(client, 'whatsapp', msg);
    window.open(`https://wa.me/51${client.phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const sendSMS = (client: NotificationAlert) => {
    const msg = `GESEM: Su servicio ${client.plan} vence pronto. Monto: S/${client.monthlyAmount.toFixed(2)}`;
    void sendNotification(client, 'sms', msg);
    window.open(`sms:+51${client.phone}?body=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      await fetchAlerts(page + 1, true);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Notificaciones" />

      <div className="page-container flex flex-col gap-6 p-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Notificaciones</h1>
            <p className="text-sm text-muted-foreground">Clientes que están por vencer o ya vencieron.</p>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="border bg-background text-foreground/80 text-xs px-3 py-1">
              {alerts.length} pendiente{alerts.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {loading ? (
          <div className="stat-card flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">Cargando notificaciones...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="stat-card flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium">Todo en orden</p>
            <p className="text-sm text-muted-foreground mt-1">Todos los clientes están al día</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((a, i) => {
              const meta = statusMeta[a.status];
              const Icon = meta.icon;
              const badgeText =
                a.status === 'expired'
                  ? `Venció hace ${Math.abs(a.daysUntilDue)} día${Math.abs(a.daysUntilDue) !== 1 ? 's' : ''}`
                  : a.daysUntilDue === 0
                    ? 'Vence hoy'
                    : `Vence en ${a.daysUntilDue} día${a.daysUntilDue !== 1 ? 's' : ''}`;

              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="stat-card group border border-border/60 bg-card/60 hover:bg-card transition-colors rounded-2xl p-4 sm:p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${meta.iconWrap}`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-foreground truncate max-w-[240px] sm:max-w-[420px]">{a.name}</p>
                          <Badge className={`${meta.badgeClass} border text-xs whitespace-nowrap`}>{badgeText}</Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <InfoChip>{a.plan}</InfoChip>
                          <InfoChip>{a.speed}</InfoChip>
                          <InfoChip>S/ {a.monthlyAmount.toFixed(2)}</InfoChip>
                          <InfoChip>Vence: {format(parseISO(a.nextPaymentDate), 'dd MMM yyyy', { locale: es })}</InfoChip>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Tel: <span className="font-medium text-foreground/80">{a.phone}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                      <button
                        onClick={() => sendWhatsApp(a)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </button>

                      <button
                        onClick={() => sendSMS(a)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium transition-colors"
                      >
                        <Smartphone className="w-4 h-4" />
                        SMS
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {hasMore && (
              <div className="pt-2">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted disabled:opacity-60"
                >
                  {loadingMore ? 'Cargando...' : 'Mostrar más'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function NotificationsPage() {
  return <NotificationsContent />;
}
