export interface Client {
  id: string;
  name: string;
  dni: string;
  phone: string;
  ip: string;
  installDate: string;
  installer: string;
  networkName: string;
  networkPassword: string;
  plan: string;
  department: string;
  province: string;
  district: string;
  speed: string;
  upload: string;
  download: string;
  charge: string;
  discharge: string;
  monthlyAmount: number;
  address: string;
  coordinates: string;
  reference: string;
  nextPaymentDate: string;
  isServiceActive: boolean;
}

export interface Payment {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  date: string;
  period: string;
}

export interface Note {
  id: string;
  content: string;
  date: string;
}

export type ClientStatus = 'active' | 'near_expiry' | 'expired';

export interface ClientWithStatus extends Client {
  status: ClientStatus;
  daysUntilDue: number;
}