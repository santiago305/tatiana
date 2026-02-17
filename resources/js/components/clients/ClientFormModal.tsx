import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGestor } from '@/context/GestorContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Client } from '@/types/client';

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
  department: z.string().max(100),
  province: z.string().max(100),
  district: z.string().max(100),
  speed: z.string().min(1, 'Requerido').max(50),
  upload: z.string().max(50),
  download: z.string().max(50),
  charge: z.string().max(50),
  discharge: z.string().max(50),
  monthlyAmount: z.number().min(0.01, 'Debe ser mayor a 0'),
  address: z.string().max(200),
  coordinates: z.string().max(100),
  reference: z.string().max(200),
  nextPaymentDate: z.string().min(1, 'Requerido'),
});

type FormData = z.infer<typeof schema>;

const EMPTY_VALUES: FormData = {
  name: '',
  dni: '',
  phone: '',
  ip: '',
  installDate: '',
  installer: '',
  networkName: '',
  networkPassword: '',
  plan: '',
  department: '',
  province: '',
  district: '',
  speed: '',
  upload: '',
  download: '',
  charge: '',
  discharge: '',
  monthlyAmount: 0,
  address: '',
  coordinates: '',
  reference: '',
  nextPaymentDate: '',
};

interface Props {
  open: boolean;
  onClose: () => void;
  editClient?: Client | null;
}

type FieldProps = {
  label: string;
  name: keyof FormData;
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  type?: string;
  placeholder?: string;
};

function Field({
  label,
  name,
  register,
  errors,
  type = 'text',
  placeholder = '',
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name, name === 'monthlyAmount' ? { valueAsNumber: true } : undefined)}
        className="h-9 text-sm"
      />
      {errors[name] && <p className="text-xs text-destructive">{errors[name]?.message}</p>}
    </div>
  );
}

export const ClientFormModal = ({ open, onClose, editClient }: Props) => {
  const { addClient, updateClient } = useGestor();
  const defaultValues: FormData = {
    ...EMPTY_VALUES,
    ...(editClient ? { ...editClient } : {}),
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
    values: defaultValues,
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

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{editClient ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] px-6 pb-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Informacion Personal</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="Nombre Completo" name="name" placeholder="Ej: Juan Perez" register={register} errors={errors} />
                <Field label="DNI" name="dni" placeholder="12345678" register={register} errors={errors} />
                <Field label="Telefono" name="phone" placeholder="951234567" register={register} errors={errors} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Informacion del Servicio</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="IP" name="ip" placeholder="192.168.200.15" register={register} errors={errors} />
                <Field label="Nombre de Red" name="networkName" placeholder="GESEM_CLIENTE" register={register} errors={errors} />
                <Field label="Contrasena Red" name="networkPassword" placeholder="contrasena" register={register} errors={errors} />
                <Field label="Plan" name="plan" placeholder="Plan Hogar 100" register={register} errors={errors} />
                <Field label="Velocidad" name="speed" placeholder="100 Mbps" register={register} errors={errors} />
                <Field label="Subida" name="upload" placeholder="50 Mbps" register={register} errors={errors} />
                <Field label="Bajada" name="download" placeholder="100 Mbps" register={register} errors={errors} />
                <Field label="Carga" name="charge" placeholder="50 Mbps" register={register} errors={errors} />
                <Field label="Descarga" name="discharge" placeholder="100 Mbps" register={register} errors={errors} />
                <Field label="Monto Mensual (S/)" name="monthlyAmount" type="number" placeholder="59.90" register={register} errors={errors} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Ubicacion</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="Departamento" name="department" placeholder="Lima" register={register} errors={errors} />
                <Field label="Provincia" name="province" placeholder="Lima" register={register} errors={errors} />
                <Field label="Distrito" name="district" placeholder="San Juan" register={register} errors={errors} />
                <Field label="Direccion" name="address" placeholder="Av. Los Jardines 456" register={register} errors={errors} />
                <Field label="Coordenadas" name="coordinates" placeholder="-12.0464,-76.9718" register={register} errors={errors} />
                <Field label="Referencia" name="reference" placeholder="Frente al parque" register={register} errors={errors} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Instalacion y Pago</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="Fecha de Instalacion" name="installDate" type="date" register={register} errors={errors} />
                <Field label="Encargado Instalacion" name="installer" placeholder="Carlos Tecnico" register={register} errors={errors} />
                <Field label="Proximo Pago" name="nextPaymentDate" type="date" register={register} errors={errors} />
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
