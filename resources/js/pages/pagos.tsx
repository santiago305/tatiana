import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Pagos',
    href: '/pagos',
  },
];

export default function PagosPage() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Pagos" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="rounded-xl border border-sidebar-border/70 p-6">
          Aqui van pagos
        </div>
      </div>
    </AppLayout>
  );
}

