import { addMonths, format, differenceInDays, parseISO, addDays } from 'date-fns';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Client, Payment, Note, ClientWithStatus, ClientStatus } from '@/types/client';

interface GestorContextType {
  clients: ClientWithStatus[];
  clientsLoading: boolean;
  payments: Payment[];
  notes: Note[];
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

type ApiResponse<T> = {
  data: T;
};

const GestorContext = createContext<GestorContextType | null>(null);

export const useGestor = () => {
  const ctx = useContext(GestorContext);
  if (!ctx) throw new Error('useGestor must be used within GestorProvider');
  return ctx;
};

const getStatus = (client: Client): { status: ClientStatus; daysUntilDue: number } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = parseISO(client.nextPaymentDate);
  const days = differenceInDays(due, today);
  if (days < 0) return { status: 'expired', daysUntilDue: days };
  if (days <= 4) return { status: 'near_expiry', daysUntilDue: days };
  return { status: 'active', daysUntilDue: days };
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const today = new Date();

const INITIAL_PAYMENTS: Payment[] = [
  { id: 'p1', clientId: '1', clientName: 'Juan Carlos Perez', amount: 59.9, date: format(addDays(today, -10), 'yyyy-MM-dd'), period: format(addDays(today, -10), 'MMMM yyyy') },
];

const readCsrf = () => {
  const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
  return token ?? '';
};

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': readCsrf(),
      ...init?.headers,
    },
    ...init,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

const getInitialData = (): { payments: Payment[]; notes: Note[] } => {
  if (typeof window === 'undefined') return { payments: INITIAL_PAYMENTS, notes: [] };

  const stored = localStorage.getItem('gesem-data');
  if (!stored) return { payments: INITIAL_PAYMENTS, notes: [] };

  try {
    const data = JSON.parse(stored);
    return {
      payments: data.payments || INITIAL_PAYMENTS,
      notes: data.notes || [],
    };
  } catch {
    return { payments: INITIAL_PAYMENTS, notes: [] };
  }
};

export const GestorProvider = ({ children }: { children: ReactNode }) => {
  const initialData = getInitialData();
  const [rawClients, setRawClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>(initialData.payments);
  const [notes, setNotes] = useState<Note[]>(initialData.notes);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gesem-data', JSON.stringify({ payments, notes }));
    }
  }, [payments, notes]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setClientsLoading(true);
        const response = await apiRequest<ApiResponse<Client[]>>('/api/clients');
        if (mounted) setRawClients(response.data);
      } catch (error) {
        console.error('No se pudo cargar clientes', error);
      } finally {
        if (mounted) setClientsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const clients: ClientWithStatus[] = useMemo(
    () =>
      rawClients.map((c) => {
        const fallback = getStatus(c);
        return {
          ...c,
          status: (c as ClientWithStatus).status ?? fallback.status,
          daysUntilDue: (c as ClientWithStatus).daysUntilDue ?? fallback.daysUntilDue,
        };
      }),
    [rawClients],
  );

  const stats = useMemo(
    () => ({
      total: clients.length,
      active: clients.filter((c) => c.status === 'active').length,
      nearExpiry: clients.filter((c) => c.status === 'near_expiry').length,
      expired: clients.filter((c) => c.status === 'expired').length,
    }),
    [clients],
  );

  const addClient = (c: Omit<Client, 'id'>) => {
    void (async () => {
      try {
        const response = await apiRequest<ApiResponse<Client>>('/api/clients', {
          method: 'POST',
          body: JSON.stringify(c),
        });
        setRawClients((prev) => [response.data, ...prev]);
      } catch (error) {
        console.error('No se pudo registrar cliente', error);
      }
    })();
  };

  const updateClient = (c: Client) => {
    void (async () => {
      try {
        const response = await apiRequest<ApiResponse<Client>>(`/api/clients/${c.id}`, {
          method: 'PUT',
          body: JSON.stringify(c),
        });
        setRawClients((prev) => prev.map((p) => (p.id === c.id ? response.data : p)));
      } catch (error) {
        console.error('No se pudo actualizar cliente', error);
      }
    })();
  };

  const deleteClient = (id: string) => {
    void (async () => {
      try {
        await apiRequest(`/api/clients/${id}`, { method: 'DELETE' });
        setRawClients((prev) => prev.filter((p) => p.id !== id));
        setPayments((prev) => prev.filter((p) => p.clientId !== id));
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
        setRawClients((prev) => prev.map((p) => (p.id === id ? response.data : p)));
      } catch (error) {
        console.error('No se pudo cambiar estado de servicio', error);
      }
    })();
  };

  const addPayment = (clientId: string, amount: number) => {
    const client = rawClients.find((c) => c.id === clientId);
    if (!client) return;
    const newPayment: Payment = {
      id: uid(),
      clientId,
      clientName: client.name,
      amount,
      date: format(new Date(), 'yyyy-MM-dd'),
      period: format(new Date(), 'MMMM yyyy'),
    };
    setPayments((prev) => [newPayment, ...prev]);
    const nextDate = addMonths(parseISO(client.nextPaymentDate), 1);
    setRawClients((prev) => prev.map((p) => (p.id === clientId ? { ...p, nextPaymentDate: format(nextDate, 'yyyy-MM-dd') } : p)));
  };

  const getClientPayments = (clientId: string) => payments.filter((p) => p.clientId === clientId);

  const addNote = (content: string) => {
    setNotes((prev) => [{ id: uid(), content, date: format(new Date(), 'yyyy-MM-dd HH:mm') }, ...prev]);
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const getAlerts = () => clients.filter((c) => c.status !== 'active').sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  return (
    <GestorContext.Provider
      value={{
        clients,
        clientsLoading,
        payments,
        notes,
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
