import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Client } from '@/types/client';
import { useGestor } from '@/context/GestorContext';
import { ScrollArea } from '@/components/ui/scroll-area';

const schema = z.object({
  name: z.string().min(1, 'Requerido').max(100),
  dni: z.string().min(1, 'Requerido').max(20),
  phone: z.string().min(1, 'Requerido').max(20),
  ip: z.string().min(1, 'Requerido').max(50),
  installDate: z.string().min(1, 'Requerido'),
  installer: z.string().min(1, 'Requerido').max(100),
  networkName: z.string().min(1, 'Requerido').max(50),
  networkPassword: z.string().min(1, 'Requerido').max(50),
  plan: z.string().min(1, 'Requerido').max(100),
  department: z.string().max(100).optional().default(''),
  province: z.string().max(100).optional().default(''),
  district: z.string().max(100).optional().default(''),
  speed: z.string().min(1, 'Requerido').max(50),
  upload: z.string().max(50).optional().default(''),
  download: z.string().max(50).optional().default(''),
  charge: z.string().max(50).optional().default(''),
  discharge: z.string().max(50).optional().default(''),
  monthlyAmount: z.coerce.number().min(0.01, 'Debe ser mayor a 0'),
  address: z.string().max(200).optional().default(''),
  coordinates: z.string().max(100).optional().default(''),
  reference: z.string().max(200).optional().default(''),
  nextPaymentDate: z.string().min(1, 'Requerido'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  editClient?: Client | null;
}

export const ClientFormModal = ({ open, onClose, editClient }: Props) => {
  const { addClient, updateClient } = useGestor();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editClient || {},
    values: editClient || undefined,
  });

  const onSubmit = (data: FormData) => {
    const clientData = {
      name: data.name,
      dni: data.dni,
      phone: data.phone,
      ip: data.ip,
      installDate: data.installDate,
      installer: data.installer,
      networkName: data.networkName,
      networkPassword: data.networkPassword,
      plan: data.plan,
      department: data.department || '',
      province: data.province || '',
      district: data.district || '',
      speed: data.speed,
      upload: data.upload || '',
      download: data.download || '',
      charge: data.charge || '',
      discharge: data.discharge || '',
      monthlyAmount: data.monthlyAmount,
      address: data.address || '',
      coordinates: data.coordinates || '',
      reference: data.reference || '',
      nextPaymentDate: data.nextPaymentDate,
      isServiceActive: true,
    };
    if (editClient) {
      updateClient({ ...editClient, ...clientData });
    } else {
      addClient(clientData);
    }
    reset();
    onClose();
  };

  const Field = ({ label, name, type = 'text', placeholder = '' }: { label: string; name: keyof FormData; type?: string; placeholder?: string }) => (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input id={name} type={type} placeholder={placeholder} {...register(name)} className="h-9 text-sm" />
      {errors[name] && <p className="text-xs text-destructive">{errors[name]?.message}</p>}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{editClient ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] px-6 pb-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Información Personal</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="Nombre Completo" name="name" placeholder="Ej: Juan Pérez" />
                <Field label="DNI" name="dni" placeholder="12345678" />
                <Field label="Teléfono" name="phone" placeholder="951234567" />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Información del Servicio</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="IP" name="ip" placeholder="192.168.200.15" />
                <Field label="Nombre de Red" name="networkName" placeholder="GESEM_CLIENTE" />
                <Field label="Contraseña Red" name="networkPassword" placeholder="contraseña" />
                <Field label="Plan" name="plan" placeholder="Plan Hogar 100" />
                <Field label="Velocidad" name="speed" placeholder="100 Mbps" />
                <Field label="Subida" name="upload" placeholder="50 Mbps" />
                <Field label="Bajada" name="download" placeholder="100 Mbps" />
                <Field label="Carga" name="charge" placeholder="50 Mbps" />
                <Field label="Descarga" name="discharge" placeholder="100 Mbps" />
                <Field label="Monto Mensual (S/)" name="monthlyAmount" type="number" placeholder="59.90" />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Ubicación</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="Departamento" name="department" placeholder="Lima" />
                <Field label="Provincia" name="province" placeholder="Lima" />
                <Field label="Distrito" name="district" placeholder="San Juan" />
                <Field label="Dirección" name="address" placeholder="Av. Los Jardines 456" />
                <Field label="Coordenadas" name="coordinates" placeholder="-12.0464,-76.9718" />
                <Field label="Referencia" name="reference" placeholder="Frente al parque" />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Instalación y Pago</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="Fecha de Instalación" name="installDate" type="date" />
                <Field label="Encargado Instalación" name="installer" placeholder="Carlos Técnico" />
                <Field label="Próximo Pago" name="nextPaymentDate" type="date" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit">{editClient ? 'Guardar Cambios' : 'Registrar Cliente'}</Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

