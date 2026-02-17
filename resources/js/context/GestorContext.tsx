import { addMonths, format, differenceInDays, parseISO, addDays } from 'date-fns';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Client, Payment, Note, ClientWithStatus, ClientStatus } from '@/types/client';

interface GestorContextType {
  clients: ClientWithStatus[];
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
const INITIAL_CLIENTS: Client[] = [
  {
    id: '1', name: 'Juan Carlos Pérez', dni: '12345678', phone: '951234567',
    ip: '192.168.200.15', installDate: '2024-03-15', installer: 'Carlos Técnico',
    networkName: 'GESEM_PEREZ', networkPassword: 'perez2024', plan: 'Plan Hogar 100',
    department: 'Lima', province: 'Lima', district: 'San Juan de Lurigancho',
    speed: '100 Mbps', upload: '50 Mbps', download: '100 Mbps', charge: '50 Mbps', discharge: '100 Mbps',
    monthlyAmount: 59.90, address: 'Av. Los Jardines 456', coordinates: '-12.0464,-76.9718',
    reference: 'Frente al parque central', nextPaymentDate: format(addDays(today, 20), 'yyyy-MM-dd'),
    isServiceActive: true,
  },
  {
    id: '2', name: 'María García López', dni: '87654321', phone: '962345678',
    ip: '192.168.200.20', installDate: '2024-05-10', installer: 'Pedro Instalador',
    networkName: 'GESEM_GARCIA', networkPassword: 'garcia2024', plan: 'Plan Negocio 200',
    department: 'Lima', province: 'Lima', district: 'Miraflores',
    speed: '200 Mbps', upload: '100 Mbps', download: '200 Mbps', charge: '100 Mbps', discharge: '200 Mbps',
    monthlyAmount: 89.90, address: 'Jr. Las Flores 123', coordinates: '-12.1186,-77.0286',
    reference: 'Al lado de la bodega', nextPaymentDate: format(addDays(today, 3), 'yyyy-MM-dd'),
    isServiceActive: true,
  },
  {
    id: '3', name: 'Carlos Eduardo López', dni: '11223344', phone: '973456789',
    ip: '192.168.200.25', installDate: '2024-01-20', installer: 'Carlos Técnico',
    networkName: 'GESEM_LOPEZ', networkPassword: 'lopez2024', plan: 'Plan Hogar 50',
    department: 'Lima', province: 'Lima', district: 'Villa El Salvador',
    speed: '50 Mbps', upload: '25 Mbps', download: '50 Mbps', charge: '25 Mbps', discharge: '50 Mbps',
    monthlyAmount: 39.90, address: 'Calle Los Olivos 789', coordinates: '-12.2124,-76.9416',
    reference: 'Cerca al mercado', nextPaymentDate: format(addDays(today, -5), 'yyyy-MM-dd'),
    isServiceActive: true,
  },
  {
    id: '4', name: 'Ana Rodríguez Martínez', dni: '55667788', phone: '984567890',
    ip: '192.168.200.30', installDate: '2024-07-01', installer: 'Pedro Instalador',
    networkName: 'GESEM_RODRIGUEZ', networkPassword: 'rodriguez2024', plan: 'Plan Hogar 100',
    department: 'Lima', province: 'Lima', district: 'Los Olivos',
    speed: '100 Mbps', upload: '50 Mbps', download: '100 Mbps', charge: '50 Mbps', discharge: '100 Mbps',
    monthlyAmount: 59.90, address: 'Av. Universitaria 321', coordinates: '-11.9839,-77.0706',
    reference: 'Frente a la universidad', nextPaymentDate: format(addDays(today, 15), 'yyyy-MM-dd'),
    isServiceActive: true,
  },
  {
    id: '5', name: 'Pedro Sánchez Huamán', dni: '99887766', phone: '995678901',
    ip: '192.168.200.35', installDate: '2024-04-12', installer: 'Carlos Técnico',
    networkName: 'GESEM_SANCHEZ', networkPassword: 'sanchez2024', plan: 'Plan Negocio 200',
    department: 'Lima', province: 'Lima', district: 'Surco',
    speed: '200 Mbps', upload: '100 Mbps', download: '200 Mbps', charge: '100 Mbps', discharge: '200 Mbps',
    monthlyAmount: 89.90, address: 'Calle Primavera 654', coordinates: '-12.1408,-76.9922',
    reference: 'A una cuadra del banco', nextPaymentDate: format(addDays(today, 2), 'yyyy-MM-dd'),
    isServiceActive: true,
  },
  {
    id: '6', name: 'Laura Martínez Quispe', dni: '33445566', phone: '916789012',
    ip: '192.168.200.40', installDate: '2024-02-28', installer: 'Pedro Instalador',
    networkName: 'GESEM_MARTINEZ', networkPassword: 'martinez2024', plan: 'Plan Hogar 50',
    department: 'Lima', province: 'Lima', district: 'Ate',
    speed: '50 Mbps', upload: '25 Mbps', download: '50 Mbps', charge: '25 Mbps', discharge: '50 Mbps',
    monthlyAmount: 39.90, address: 'Jr. Huáscar 987', coordinates: '-12.0256,-76.9180',
    reference: 'Al costado de la farmacia', nextPaymentDate: format(addDays(today, -3), 'yyyy-MM-dd'),
    isServiceActive: true,
  },
];

const INITIAL_PAYMENTS: Payment[] = [
  { id: 'p1', clientId: '1', clientName: 'Juan Carlos Pérez', amount: 59.90, date: format(addDays(today, -10), 'yyyy-MM-dd'), period: format(addDays(today, -10), 'MMMM yyyy') },
  { id: 'p2', clientId: '2', clientName: 'María García López', amount: 89.90, date: format(addDays(today, -25), 'yyyy-MM-dd'), period: format(addDays(today, -25), 'MMMM yyyy') },
  { id: 'p3', clientId: '4', clientName: 'Ana Rodríguez Martínez', amount: 59.90, date: format(addDays(today, -5), 'yyyy-MM-dd'), period: format(addDays(today, -5), 'MMMM yyyy') },
  { id: 'p4', clientId: '1', clientName: 'Juan Carlos Pérez', amount: 59.90, date: format(addDays(today, -40), 'yyyy-MM-dd'), period: format(addDays(today, -40), 'MMMM yyyy') },
  { id: 'p5', clientId: '5', clientName: 'Pedro Sánchez Huamán', amount: 89.90, date: format(addDays(today, -15), 'yyyy-MM-dd'), period: format(addDays(today, -15), 'MMMM yyyy') },
];

const getInitialData = (): { clients: Client[]; payments: Payment[]; notes: Note[] } => {
  if (typeof window === 'undefined') {
    return { clients: INITIAL_CLIENTS, payments: INITIAL_PAYMENTS, notes: [] };
  }

  const stored = localStorage.getItem('gesem-data');

  if (!stored) {
    return { clients: INITIAL_CLIENTS, payments: INITIAL_PAYMENTS, notes: [] };
  }

  try {
    const data = JSON.parse(stored);
    return {
      clients: data.clients || INITIAL_CLIENTS,
      payments: data.payments || INITIAL_PAYMENTS,
      notes: data.notes || [],
    };
  } catch {
    return { clients: INITIAL_CLIENTS, payments: INITIAL_PAYMENTS, notes: [] };
  }
};
export const GestorProvider = ({ children }: { children: ReactNode }) => {
  const initialData = getInitialData();
  const [rawClients, setRawClients] = useState<Client[]>(initialData.clients);
  const [payments, setPayments] = useState<Payment[]>(initialData.payments);
  const [notes, setNotes] = useState<Note[]>(initialData.notes);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gesem-data', JSON.stringify({ clients: rawClients, payments, notes }));
    }
  }, [rawClients, payments, notes]);

  const clients: ClientWithStatus[] = useMemo(
    () => rawClients.map(c => {
      const { status, daysUntilDue } = getStatus(c);
      return { ...c, status, daysUntilDue };
    }),
    [rawClients]
  );

  const stats = useMemo(() => ({
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    nearExpiry: clients.filter(c => c.status === 'near_expiry').length,
    expired: clients.filter(c => c.status === 'expired').length,
  }), [clients]);

  const addClient = (c: Omit<Client, 'id'>) => {
    setRawClients(prev => [...prev, { ...c, id: uid() }]);
  };

  const updateClient = (c: Client) => {
    setRawClients(prev => prev.map(p => p.id === c.id ? c : p));
  };

  const deleteClient = (id: string) => {
    setRawClients(prev => prev.filter(p => p.id !== id));
    setPayments(prev => prev.filter(p => p.clientId !== id));
  };

  const toggleService = (id: string) => {
    setRawClients(prev => prev.map(p => p.id === id ? { ...p, isServiceActive: !p.isServiceActive } : p));
  };

  const addPayment = (clientId: string, amount: number) => {
    const client = rawClients.find(c => c.id === clientId);
    if (!client) return;
    const newPayment: Payment = {
      id: uid(),
      clientId,
      clientName: client.name,
      amount,
      date: format(new Date(), 'yyyy-MM-dd'),
      period: format(new Date(), 'MMMM yyyy'),
    };
    setPayments(prev => [newPayment, ...prev]);
    // Advance next payment date by 1 month
    const nextDate = addMonths(parseISO(client.nextPaymentDate), 1);
    setRawClients(prev => prev.map(p =>
      p.id === clientId ? { ...p, nextPaymentDate: format(nextDate, 'yyyy-MM-dd') } : p
    ));
  };

  const getClientPayments = (clientId: string) => payments.filter(p => p.clientId === clientId);

  const addNote = (content: string) => {
    setNotes(prev => [{ id: uid(), content, date: format(new Date(), 'yyyy-MM-dd HH:mm') }, ...prev]);
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const getAlerts = () => clients.filter(c => c.status !== 'active').sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  return (
    <GestorContext.Provider value={{
      clients, payments, notes, addClient, updateClient, deleteClient,
      toggleService, addPayment, getClientPayments, addNote, deleteNote, stats, getAlerts
    }}>
      {children}
    </GestorContext.Provider>
  );
};

