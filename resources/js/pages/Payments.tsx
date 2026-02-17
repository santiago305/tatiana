import { Head, usePage } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { GestorProvider, useGestor } from '@/context/GestorContext';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { PaymentFormModal } from '@/components/payments/PaymentFormModal';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Pagos',
    href: '/pagos',
  },
];

const PAGE_SIZE = 15;

function PaymentsContent() {
  const { payments } = useGestor();
  const { url } = usePage();
  const clientIdParam = useMemo(() => {
    try {
      return new URL(url, 'http://localhost').searchParams.get('clientId');
    } catch {
      return null;
    }
  }, [url]);

  const [formOpen, setFormOpen] = useState(Boolean(clientIdParam));
  const [preSelectedId, setPreSelectedId] = useState<string | null>(clientIdParam);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(payments.length / PAGE_SIZE));
  const paginated = payments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Pagos" />
      <div className="page-container">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">Pagos</h1>
          <Button onClick={() => { setPreSelectedId(null); setFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-1.5" />
            Registrar Pago
          </Button>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="stat-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Monto</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden sm:table-cell">Fecha</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Periodo</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(p => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">{p.clientName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold">S/ {p.amount.toFixed(2)}</td>
                    <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">
                      {format(parseISO(p.date), 'dd/MM/yyyy')}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground capitalize">{p.period}</td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-muted-foreground">
                      No hay pagos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Mostrando {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, payments.length)} de {payments.length}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${page === i + 1 ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>

        <PaymentFormModal open={formOpen} onClose={() => { setFormOpen(false); setPreSelectedId(null); }} preSelectedClientId={preSelectedId} />
      </div>
    </AppLayout>
  );
}

export default function PaymentsPage() {
  return (
    <GestorProvider>
      <PaymentsContent />
    </GestorProvider>
  );
}
