import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGestor } from '@/context/GestorContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ClientWithStatus } from '@/types/client';

interface Props {
  open: boolean;
  onClose: () => void;
  client: ClientWithStatus | null;
}

const statusLabels: Record<string, string> = {
  active: 'Activo',
  near_expiry: 'Próximo a vencer',
  expired: 'Vencido',
};

const statusClasses: Record<string, string> = {
  active: 'status-active',
  near_expiry: 'status-near-expiry',
  expired: 'status-expired',
};

export const ClientDetailModal = ({ open, onClose, client }: Props) => {
  const [tab, setTab] = useState<'servicio' | 'cliente' | 'pagos'>('servicio');
  const { getClientPayments, toggleService } = useGestor();

  if (!client) return null;

  const payments = getClientPayments(client.id);

  const InfoRow = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">{client.name}</DialogTitle>
            <Badge className={`${statusClasses[client.status]} border text-xs`}>
              {statusLabels[client.status]}
            </Badge>
          </div>
          <div className="flex items-center gap-1 mt-3 border-b border-border">
            {(['servicio', 'cliente', 'pagos'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="pt-4"
            >
              {tab === 'servicio' && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-4">
                    {client.isServiceActive ? (
                      <Wifi className="w-5 h-5 text-success" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-destructive" />
                    )}
                    <span className="text-sm font-medium">
                      Servicio {client.isServiceActive ? 'Activo' : 'Desactivado'}
                    </span>
                    <button
                      onClick={() => toggleService(client.id)}
                      className={`ml-auto text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                        client.isServiceActive
                          ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                          : 'bg-success/10 text-success hover:bg-success/20'
                      }`}
                    >
                      {client.isServiceActive ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                  <InfoRow label="IP" value={client.ip} />
                  <InfoRow label="Plan" value={client.plan} />
                  <InfoRow label="Velocidad" value={client.speed} />
                  <InfoRow label="Subida" value={client.upload} />
                  <InfoRow label="Bajada" value={client.download} />
                  <InfoRow label="Carga" value={client.charge} />
                  <InfoRow label="Descarga" value={client.discharge} />
                  <InfoRow label="Nombre de Red" value={client.networkName} />
                  <InfoRow label="Contraseña Red" value={client.networkPassword} />
                  <InfoRow label="Monto Mensual" value={`S/ ${client.monthlyAmount.toFixed(2)}`} />
                  <InfoRow label="Próximo Pago" value={format(parseISO(client.nextPaymentDate), 'dd MMM yyyy', { locale: es })} />
                  <InfoRow label="Instalación" value={format(parseISO(client.installDate), 'dd MMM yyyy', { locale: es })} />
                  <InfoRow label="Instalador" value={client.installer} />
                </div>
              )}

              {tab === 'cliente' && (
                <div className="space-y-1">
                  <InfoRow label="Nombre" value={client.name} />
                  <InfoRow label="DNI" value={client.dni} />
                  <InfoRow label="Teléfono" value={client.phone} />
                  <InfoRow label="Departamento" value={client.department} />
                  <InfoRow label="Provincia" value={client.province} />
                  <InfoRow label="Distrito" value={client.district} />
                  <InfoRow label="Dirección" value={client.address} />
                  <InfoRow label="Coordenadas" value={client.coordinates} />
                  <InfoRow label="Referencia" value={client.reference} />
                </div>
              )}

              {tab === 'pagos' && (
                <div className="space-y-3">
                  {payments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Sin pagos registrados</p>
                  ) : (
                    payments.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">S/ {p.amount.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">{p.period}</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(p.date), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
