import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, Calendar, Wifi, DollarSign } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGestor } from '@/context/GestorContext';
import type { ClientWithStatus } from '@/types/client';

interface Props {
  open: boolean;
  onClose: () => void;
  preSelectedClientId?: string | null;
}

const statusLabels: Record<string, string> = { active: 'Activo', near_expiry: 'Próximo a vencer', expired: 'Vencido' };
const statusClasses: Record<string, string> = { active: 'status-active', near_expiry: 'status-near-expiry', expired: 'status-expired' };

export const PaymentFormModal = ({ open, onClose, preSelectedClientId }: Props) => {
  const { clients, addPayment } = useGestor();
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientWithStatus | null>(
    preSelectedClientId ? clients.find(c => c.id === preSelectedClientId) || null : null
  );
  const [amount, setAmount] = useState('');
  const [showResults, setShowResults] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) || c.dni.includes(q) || c.phone.includes(q)
    ).slice(0, 5);
  }, [search, clients]);

  const handleSelect = (client: ClientWithStatus) => {
    setSelectedClient(client);
    setAmount(client.monthlyAmount.toFixed(2));
    setSearch('');
    setShowResults(false);
  };

  const handleSubmit = () => {
    if (!selectedClient || !amount) return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    addPayment(selectedClient.id, numAmount);
    setSelectedClient(null);
    setAmount('');
    onClose();
  };

  const handleClose = () => {
    setSelectedClient(null);
    setAmount('');
    setSearch('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedClient && (
            <div className="relative">
              <Label className="text-xs text-muted-foreground">Buscar cliente</Label>
              <div className="relative mt-1.5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Nombre, DNI o teléfono..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setShowResults(true); }}
                  onFocus={() => setShowResults(true)}
                  className="pl-9"
                />
              </div>
              {showResults && filtered.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-auto">
                  {filtered.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleSelect(c)}
                      className="w-full text-left px-3 py-2.5 hover:bg-muted transition-colors flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.dni} · {c.phone}</p>
                      </div>
                      <Badge className={`${statusClasses[c.status]} border text-xs`}>
                        {statusLabels[c.status]}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedClient && (
            <>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{selectedClient.name}</h4>
                  <button onClick={() => setSelectedClient(null)} className="text-xs text-primary hover:underline">
                    Cambiar
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Wifi className="w-3.5 h-3.5" />
                    <span>{selectedClient.plan}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span>Velocidad: {selectedClient.speed}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Vence: {format(parseISO(selectedClient.nextPaymentDate), 'dd MMM yyyy', { locale: es })}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Monto: S/ {selectedClient.monthlyAmount.toFixed(2)}</span>
                  </div>
                </div>
                <Badge className={`${statusClasses[selectedClient.status]} border text-xs mt-1`}>
                  {statusLabels[selectedClient.status]}
                </Badge>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Monto del Pago (S/)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="text-lg font-semibold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={handleClose}>Cancelar</Button>
                <Button className="flex-1" onClick={handleSubmit} disabled={!amount || parseFloat(amount) <= 0}>
                  Registrar Pago
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
