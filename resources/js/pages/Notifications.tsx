import { Head } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Send, AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GestorProvider, useGestor } from '@/context/GestorContext';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Notificaciones',
    href: '/notificaciones',
  },
];

const statusClasses: Record<string, string> = { near_expiry: 'status-near-expiry', expired: 'status-expired' };

function NotificationsContent() {
  const { getAlerts } = useGestor();
  const alerts = getAlerts();

  const sendWhatsApp = (client: typeof alerts[0]) => {
    const msg = client.status === 'expired'
      ? `Hola ${client.name}, le informamos que su servicio de internet (${client.plan}) ha vencido. Su pago de S/ ${client.monthlyAmount.toFixed(2)} está pendiente. Por favor regularice su situación para evitar la suspensión. - GESEM`
      : `Hola ${client.name}, le recordamos que su servicio de internet (${client.plan} - ${client.speed}) vence el ${format(parseISO(client.nextPaymentDate), 'dd/MM/yyyy')}. Monto: S/ ${client.monthlyAmount.toFixed(2)}. Gracias - GESEM`;
    window.open(`https://wa.me/51${client.phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const sendSMS = (client: typeof alerts[0]) => {
    const msg = `GESEM: Su servicio ${client.plan} vence pronto. Monto: S/${client.monthlyAmount.toFixed(2)}`;
    window.open(`sms:+51${client.phone}?body=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Notificaciones" />
      <div className="page-container flex flex-col p-8 gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Notificaciones</h1>
          <Badge variant="outline" className="text-xs">
            {alerts.length} pendientes
          </Badge>
        </div>

        {alerts.length === 0 ? (
          <div className="stat-card flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Todos los clientes están al día</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="stat-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    a.status === 'expired' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {a.status === 'expired' ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{a.name}</p>
                      <Badge className={`${statusClasses[a.status]} border text-xs`}>
                        {a.status === 'expired'
                          ? `Venció hace ${Math.abs(a.daysUntilDue)} día${Math.abs(a.daysUntilDue) !== 1 ? 's' : ''}`
                          : a.daysUntilDue === 0
                            ? 'Vence hoy'
                            : `Vence en ${a.daysUntilDue} día${a.daysUntilDue !== 1 ? 's' : ''}`
                        }
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {a.plan} – {a.speed} – S/ {a.monthlyAmount.toFixed(2)} – Vence: {format(parseISO(a.nextPaymentDate), 'dd MMM yyyy', { locale: es })}
                    </p>
                    <p className="text-xs text-muted-foreground">Tel: {a.phone}</p>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => sendWhatsApp(a)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => sendSMS(a)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    SMS
                  </button>
                </div>
              </motion.div>
            ))}
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
