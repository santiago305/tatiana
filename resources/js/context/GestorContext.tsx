import { addMonths, differenceInDays, format, parseISO } from 'date-fns';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Client, ClientStatus, ClientWithStatus, Note, Payment } from '@/types/client';

interface PaginationMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

interface GestorContextType {
  clients: ClientWithStatus[];
  clientsLoading: boolean;
  clientsMeta: PaginationMeta;
  payments: Payment[];
  paymentsLoading: boolean;
  paymentsMeta: PaginationMeta;
  notes: Note[];
  fetchClientsPage: (page?: number, search?: string) => void;
  fetchPaymentsPage: (page?: number) => void;
  addClient: (c: Omit<Client, 'id'>) => void;
  updateClient: (c: Client) => void;
  deleteClient: (id: string) => void;
  toggleService: (id: string) => void;
  addPayment: (clientId: string, amount: number) => void;
  getClientPayments: (clientId: string) => Payment[];
  addNote: (content: string) => void;
  deleteNote: (id: string) => void;
  stats: { total: number; active: number; nearExpiry: number; expired: number };
  getAlerts: () => ClientWithStatus[];
}

type ApiResponse<T> = { data: T; meta?: { current_page: number; last_page: number; per_page: number; total: number } };

const DEFAULT_META: PaginationMeta = { currentPage: 1, lastPage: 1, perPage: 15, total: 0 };

const GestorContext = createContext<GestorContextType | null>(null);

export const useGestor = () => {
  const ctx = useContext(GestorContext);
  if (!ctx) throw new Error('useGestor must be used within GestorProvider');
  return ctx;
};

const readCsrf = () => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': readCsrf(),
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

const toMeta = (meta?: { current_page: number; last_page: number; per_page: number; total: number }): PaginationMeta =>
  meta
    ? {
        currentPage: meta.current_page,
        lastPage: meta.last_page,
        perPage: meta.per_page,
        total: meta.total,
      }
    : DEFAULT_META;

const getStatus = (client: Client): { status: ClientStatus; daysUntilDue: number } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = parseISO(client.nextPaymentDate);
  const days = differenceInDays(due, today);
  if (days < 0) return { status: 'expired', daysUntilDue: days };
  if (days <= 4) return { status: 'near_expiry', daysUntilDue: days };
  return { status: 'active', daysUntilDue: days };
};

export const GestorProvider = ({ children }: { children: ReactNode }) => {
  const [rawClients, setRawClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsMeta, setClientsMeta] = useState<PaginationMeta>(DEFAULT_META);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsMeta, setPaymentsMeta] = useState<PaginationMeta>(DEFAULT_META);
  const [notes, setNotes] = useState<Note[]>([]);
  const clientsAbortRef = useRef<AbortController | null>(null);
  const paymentsAbortRef = useRef<AbortController | null>(null);
  const clientsRequestIdRef = useRef(0);
  const paymentsRequestIdRef = useRef(0);

  const fetchClientsPage = useCallback((page = 1, search = '') => {
    void (async () => {
      clientsRequestIdRef.current += 1;
      const requestId = clientsRequestIdRef.current;
      clientsAbortRef.current?.abort();
      const controller = new AbortController();
      clientsAbortRef.current = controller;

      try {
        setClientsLoading(true);
        const params = new URLSearchParams({
          page: String(page),
          per_page: '15',
        });
        if (search.trim()) params.set('search', search.trim());
        const response = await apiRequest<ApiResponse<Client[]>>(`/api/clients?${params.toString()}`, {
          signal: controller.signal,
        });
        if (requestId !== clientsRequestIdRef.current) return;
        setRawClients(response.data);
        setClientsMeta(toMeta(response.meta));
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('No se pudo cargar clientes', error);
      } finally {
        if (requestId === clientsRequestIdRef.current) {
          setClientsLoading(false);
        }
      }
    })();
  }, []);

  const fetchPaymentsPage = useCallback((page = 1) => {
    void (async () => {
      paymentsRequestIdRef.current += 1;
      const requestId = paymentsRequestIdRef.current;
      paymentsAbortRef.current?.abort();
      const controller = new AbortController();
      paymentsAbortRef.current = controller;

      try {
        setPaymentsLoading(true);
        const response = await apiRequest<ApiResponse<Payment[]>>(`/api/payments?page=${page}&per_page=15`, {
          signal: controller.signal,
        });
        if (requestId !== paymentsRequestIdRef.current) return;
        setPayments(response.data);
        setPaymentsMeta(toMeta(response.meta));
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('No se pudo cargar pagos', error);
      } finally {
        if (requestId === paymentsRequestIdRef.current) {
          setPaymentsLoading(false);
        }
      }
    })();
  }, []);

  useEffect(() => {
    fetchClientsPage(1);
    fetchPaymentsPage(1);
  }, []);

  const clients: ClientWithStatus[] = useMemo(
    () =>
      rawClients.map((client) => {
        const fallback = getStatus(client);
        return {
          ...client,
          status: (client as ClientWithStatus).status ?? fallback.status,
          daysUntilDue: (client as ClientWithStatus).daysUntilDue ?? fallback.daysUntilDue,
        };
      }),
    [rawClients],
  );

  const stats = useMemo(
    () => ({
      total: clientsMeta.total,
      active: clients.filter((c) => c.status === 'active').length,
      nearExpiry: clients.filter((c) => c.status === 'near_expiry').length,
      expired: clients.filter((c) => c.status === 'expired').length,
    }),
    [clients, clientsMeta.total],
  );

  const addClient = (client: Omit<Client, 'id'>) => {
    void (async () => {
      try {
        await apiRequest<ApiResponse<Client>>('/api/clients', {
          method: 'POST',
          body: JSON.stringify(client),
        });
        fetchClientsPage(1);
      } catch (error) {
        console.error('No se pudo registrar cliente', error);
      }
    })();
  };

  const updateClient = (client: Client) => {
    void (async () => {
      try {
        await apiRequest<ApiResponse<Client>>(`/api/clients/${client.id}`, {
          method: 'PUT',
          body: JSON.stringify(client),
        });
        fetchClientsPage(clientsMeta.currentPage);
      } catch (error) {
        console.error('No se pudo actualizar cliente', error);
      }
    })();
  };

  const deleteClient = (id: string) => {
    void (async () => {
      try {
        await apiRequest(`/api/clients/${id}`, { method: 'DELETE' });
        fetchClientsPage(clientsMeta.currentPage);
      } catch (error) {
        console.error('No se pudo eliminar cliente', error);
      }
    })();
  };

  const toggleService = (id: string) => {
    void (async () => {
      try {
        const response = await apiRequest<ApiResponse<Client>>(`/api/clients/${id}/toggle-service`, {
          method: 'PATCH',
        });
        setRawClients((prev) => prev.map((item) => (item.id === id ? response.data : item)));
      } catch (error) {
        console.error('No se pudo cambiar estado de servicio', error);
      }
    })();
  };

  const addPayment = (clientId: string, amount: number) => {
    void (async () => {
      try {
        const response = await apiRequest<ApiResponse<Payment>>('/api/payments', {
          method: 'POST',
          body: JSON.stringify({ clientId, amount }),
        });

        setPayments((prev) => [response.data, ...prev].slice(0, 15));
        setRawClients((prev) =>
          prev.map((item) =>
            item.id === clientId
              ? { ...item, nextPaymentDate: format(addMonths(parseISO(item.nextPaymentDate), 1), 'yyyy-MM-dd') }
              : item,
          ),
        );
      } catch (error) {
        console.error('No se pudo registrar pago', error);
      }
    })();
  };

  const getClientPayments = (clientId: string) => payments.filter((payment) => payment.clientId === clientId);

  const addNote = (content: string) => {
    const id = `${Date.now()}`;
    setNotes((prev) => [{ id, content, date: format(new Date(), 'yyyy-MM-dd HH:mm') }, ...prev]);
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const getAlerts = () => clients.filter((client) => client.status !== 'active').sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  return (
    <GestorContext.Provider
      value={{
        clients,
        clientsLoading,
        clientsMeta,
        payments,
        paymentsLoading,
        paymentsMeta,
        notes,
        fetchClientsPage,
        fetchPaymentsPage,
        addClient,
        updateClient,
        deleteClient,
        toggleService,
        addPayment,
        getClientPayments,
        addNote,
        deleteNote,
        stats,
        getAlerts,
      }}
    >
      {children}
    </GestorContext.Provider>
  );
};
