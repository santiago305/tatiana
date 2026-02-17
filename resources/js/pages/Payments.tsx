import { Head, usePage } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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

function PaymentsContent() {
  const { payments, paymentsLoading, paymentsMeta, fetchPaymentsPage } = useGestor();
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
  const initialPage = useMemo(() => {
    try {
      return Number(new URL(url, 'http://localhost').searchParams.get('page') || '1');
    } catch {
      return 1;
    }
  }, [url]);

  const [page, setPage] = useState(Math.max(1, initialPage));

  const totalPages = Math.max(1, paymentsMeta.lastPage);
  const paginated = payments;
  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const items: Array<number | '...'> = [1];
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    if (start > 2) items.push('...');
    for (let i = start; i <= end; i += 1) items.push(i);
    if (end < totalPages - 1) items.push('...');

    items.push(totalPages);
    return items;
  }, [page, totalPages]);

  useEffect(() => {
    fetchPaymentsPage(page);
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (clientIdParam) params.set('clientId', clientIdParam);
    window.history.replaceState(null, '', `/pagos?${params.toString()}`);
  }, [clientIdParam, fetchPaymentsPage, page]);
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Pagos" />
      <div className="page-container p-8 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">Pagos</h1>
          <Button onClick={() => { setPreSelectedId(null); setFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-1.5" />
            Registrar Pago
          </Button>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="stat-card overflow-hidden p-0">
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <p className="text-[11px] text-muted-foreground">
                Mostrando {paymentsMeta.total === 0 ? 0 : (page - 1) * paymentsMeta.perPage + 1}-{Math.min(page * paymentsMeta.perPage, paymentsMeta.total)} de {paymentsMeta.total}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded-md hover:bg-muted disabled:opacity-30">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {paginationItems.map((item, idx) =>
                  item === '...' ? (
                    <span key={`ellipsis-${idx}`} className="w-7 h-7 inline-flex items-center justify-center text-[11px] text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <button key={item} onClick={() => setPage(item)} className={`w-7 h-7 rounded-md text-[11px] font-medium transition-colors ${page === item ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                      {item}
                    </button>
                  ),
                )}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded-md hover:bg-muted disabled:opacity-30">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
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
                {paymentsLoading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-muted-foreground">
                      Cargando pagos...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-muted-foreground">
                      No hay pagos registrados
                    </td>
                  </tr>
                ) : (
                  paginated.map(p => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>

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
