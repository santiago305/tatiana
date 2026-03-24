import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

type NotificationStatus = 'near_expiry' | 'expired' | 'active';

type NotificationMessageClient = {
  name: string;
  nextPaymentDate: string;
  status: NotificationStatus;
};

export function buildWhatsAppNotificationMessage(client: NotificationMessageClient): string {
  if (client.status === 'expired') {
    return `Estimado ${client.name}, le recordamos que tiene un pago vencido del servicio de internet ,  recomendamos que proceda con el pago a fin de mantenerse conectado. Derivar el comprobante por este medio`;
  }

  const dueDate = parseISO(client.nextPaymentDate);
  const month = format(dueDate, 'MMMM', { locale: es });
  // const formattedDueDate = format(dueDate, 'dd/MM/yyyy');

  return `Estimado cliente, le recordamos que su servicio de internet correspondiente al mes de ${month} está próximo a vencer. Agradeceremos pueda realizar el pago correspondiente antes de la fecha, a fin de evitar la suspensión del servicio. Saludos cordiales.`;
}
