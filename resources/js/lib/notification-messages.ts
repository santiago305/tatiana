import { format, parseISO } from 'date-fns';

type NotificationStatus = 'near_expiry' | 'expired' | 'active';

type NotificationMessageClient = {
  name: string;
  nextPaymentDate: string;
  status: NotificationStatus;
};

export function buildWhatsAppNotificationMessage(client: NotificationMessageClient): string {
  if (client.status === 'expired') {
    return `Estimado ${client.name}, le recordamos que tiene un pago vencido del servicio de internet , recomendamos que proceda con el corte de servicio por falta de pago. Derivar el comprobante por este medio.`;
  }

  return `Estimado ${client.name},  le recordamos que tiene un pago proximo a vencer del servicio de internet , recomendamos que proceda con el pago a fin de mantenerse conectado. Derivar el comprobante por este medio. vence el ${format(parseISO(client.nextPaymentDate), 'dd/MM/yyyy')}.`;
}
