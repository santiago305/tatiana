import { Head, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  WifiOff,
  Wifi,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GestorProvider, useGestor } from '@/context/GestorContext';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { ClientDetailModal } from '@/components/clients/ClientDetailModal';
import { ClientFormModal } from '@/components/clients/ClientFormModal';
import type { Client, ClientWithStatus } from '@/types/client';

const statusLabels: Record<string, string> = {
  active: 'Activo',
  near_expiry: 'Proximo a vencer',
  expired: 'Vencido',
};

const statusClasses: Record<string, string> = {
  active: 'status-active',
  near_expiry: 'status-near-expiry',
  expired: 'status-expired',
};

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Clientes',
    href: '/clients',
  },
];

const ClientsContent = () => {
  const { clients, clientsLoading, clientsMeta, fetchClientsPage, deleteClient, toggleService } = useGestor();
  const { url } = usePage();
  const initialPage = useMemo(() => {
    try {
      return Number(new URL(url, 'http://localhost').searchParams.get('page') || '1');
    } catch {
      return 1;
    }
  }, [url]);
  const initialSearch = useMemo(() => {
    try {
      return new URL(url, 'http://localhost').searchParams.get('search') || '';
    } catch {
      return '';
    }
  }, [url]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(Math.max(1, initialPage));
  const [formOpen, setFormOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [detailClient, setDetailClient] = useState<ClientWithStatus | null>(null);

  const totalPages = Math.max(1, clientsMeta.lastPage);
  const paginated = clients;
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
    if (initialSearch) setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    fetchClientsPage(page, search);
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (search.trim()) params.set('search', search.trim());
    window.history.replaceState(null, '', `/clients?${params.toString()}`);
  }, [fetchClientsPage, page, search]);

  const handleEdit = (c: ClientWithStatus) => {
    setEditClient(c);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Estas seguro de eliminar este cliente?')) {
      deleteClient(id);
    }
  };

  const handlePayment = (clientId: string) => {
    router.get('/pagos', { clientId });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Clientes" />
      <div className="page-container p-8 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <Button
            onClick={() => {
              setEditClient(null);
              setFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nuevo Cliente
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, DNI o telefono..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="stat-card overflow-hidden p-0">
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <p className="text-[11px] text-muted-foreground">
                Mostrando {clientsMeta.total === 0 ? 0 : (page - 1) * clientsMeta.perPage + 1}-{Math.min(page * clientsMeta.perPage, clientsMeta.total)} de {clientsMeta.total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 rounded-md hover:bg-muted disabled:opacity-30"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {paginationItems.map((item, idx) =>
                  item === '...' ? (
                    <span key={`ellipsis-${idx}`} className="w-7 h-7 inline-flex items-center justify-center text-[11px] text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item)}
                      className={`w-7 h-7 rounded-md text-[11px] font-medium transition-colors ${
                        page === item ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1 rounded-md hover:bg-muted disabled:opacity-30"
                >
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
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden sm:table-cell">DNI</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Telefono</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden lg:table-cell">Plan</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden lg:table-cell">Monto</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Estado</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Internet</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientsLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      Cargando clientes...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      {search ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                    </td>
                  </tr>
                ) : (
                  paginated.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{c.phone}</p>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">{c.dni}</td>
                      <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">{c.phone}</td>
                      <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">{c.plan}</td>
                      <td className="py-3 px-4 hidden lg:table-cell">S/ {c.monthlyAmount.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <Badge className={`${statusClasses[c.status]} border text-xs`}>{statusLabels[c.status]}</Badge>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <button onClick={() => toggleService(c.id)} title={c.isServiceActive ? 'Desactivar' : 'Activar'}>
                          {c.isServiceActive ? (
                            <Wifi className="w-4 h-4 text-success" />
                          ) : (
                            <WifiOff className="w-4 h-4 text-destructive" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setDetailClient(c)} className="p-1.5 rounded-md hover:bg-muted" title="Ver detalles">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button onClick={() => handlePayment(c.id)} className="p-1.5 rounded-md hover:bg-muted" title="Registrar pago">
                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button onClick={() => handleEdit(c)} className="p-1.5 rounded-md hover:bg-muted" title="Editar">
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-md hover:bg-destructive/10" title="Eliminar">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </motion.div>

        <ClientFormModal
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditClient(null);
          }}
          editClient={editClient}
        />
        <ClientDetailModal open={!!detailClient} onClose={() => setDetailClient(null)} client={detailClient} />
      </div>
    </AppLayout>
  );
};

export default function ClientsPage() {
  return (
    <GestorProvider>
      <ClientsContent />
    </GestorProvider>
  );
}
