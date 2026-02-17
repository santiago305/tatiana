import { Head } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, MessageCircle, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GestorProvider, useGestor } from '@/context/GestorContext';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Notificaciones', href: '/notificaciones' },
];

const statusMeta = {
  near_expiry: {
    label: 'Próximo',
    badgeClass: 'status-near-expiry',
    iconWrap: 'bg-amber-50 text-amber-700',
    icon: Clock,
  },
  expired: {
    label: 'Vencido',
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
  const { getAlerts } = useGestor();
  const alerts = getAlerts();

  const sendWhatsApp = (client: typeof alerts[0]) => {
    const msg =
      client.status === 'expired'
        ? `Hola ${client.name}, le informamos que su servicio de internet (${client.plan}) ha vencido. Su pago de S/ ${client.monthlyAmount.toFixed(
            2
          )} está pendiente. Por favor regularice su situación para evitar la suspensión. - GESEM`
        : `Hola ${client.name}, le recordamos que su servicio de internet (${client.plan} - ${
            client.speed
          }) vence el ${format(parseISO(client.nextPaymentDate), 'dd/MM/yyyy')}. Monto: S/ ${client.monthlyAmount.toFixed(
            2
          )}. Gracias - GESEM`;
    window.open(`https://wa.me/51${client.phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const sendSMS = (client: typeof alerts[0]) => {
    const msg = `GESEM: Su servicio ${client.plan} vence pronto. Monto: S/${client.monthlyAmount.toFixed(2)}`;
    window.open(`sms:+51${client.phone}?body=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Notificaciones" />

      <div className="page-container flex flex-col gap-6 p-8">
        {/* Header mejorado */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Notificaciones</h1>
            <p className="text-sm text-muted-foreground">
              Clientes que están por vencer o ya vencieron (porque la vida es así).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="border bg-background text-foreground/80 text-xs px-3 py-1">
              {alerts.length} pendiente{alerts.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {alerts.length === 0 ? (
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
                    {/* Left */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${meta.iconWrap}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-foreground truncate max-w-[240px] sm:max-w-[420px]">
                            {a.name}
                          </p>

                          <Badge className={`${meta.badgeClass} border text-xs whitespace-nowrap`}>
                            {badgeText}
                          </Badge>
                        </div>

                        {/* Chips para info rápida */}
                        <div className="mt-2 flex flex-wrap gap-2">
                          <InfoChip>{a.plan}</InfoChip>
                          <InfoChip>{a.speed}</InfoChip>
                          <InfoChip>S/ {a.monthlyAmount.toFixed(2)}</InfoChip>
                          <InfoChip>
                            Vence: {format(parseISO(a.nextPaymentDate), 'dd MMM yyyy', { locale: es })}
                          </InfoChip>
                        </div>

                        <p className="text-xs text-muted-foreground mt-2">
                          Tel: <span className="font-medium text-foreground/80">{a.phone}</span>
                        </p>
                      </div>
                    </div>

                    {/* Right buttons */}
                    <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                      <button
                        onClick={() => sendWhatsApp(a)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl
                                   bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </button>

                      <button
                        onClick={() => sendSMS(a)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl
                                   bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium transition-colors"
                      >
                        <Smartphone className="w-4 h-4" />
                        SMS
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function NotificationsPage() {
  return (
    <GestorProvider>
      <NotificationsContent />
    </GestorProvider>
  );
}
