import { Link } from '@inertiajs/react';
import { Bell, CreditCard, LayoutGrid, Users, Wifi } from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { dashboard } from '@/routes';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Clientes',
        href: '/clients',
        icon: Users,
    },
    {
        title: 'Pagos',
        href: dashboard({ query: { section: 'pagos' } }),
        icon: CreditCard,
    },
    {
        title: 'Notificaciones',
        href: dashboard({ query: { section: 'notificaciones' } }),
        icon: Bell,
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    return (
        <Sidebar
            collapsible="icon"
            variant="inset"
            className="group-data-[variant=inset]:p-3"
        >
            <SidebarHeader className="rounded-2xl border border-sidebar-border bg-white/95 p-3 shadow-sm">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="h-14 rounded-xl"
                        >
                            <Link href={dashboard()} prefetch>
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                                    <Wifi className="h-4 w-4" />
                                </div>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="mt-3 rounded-2xl border border-sidebar-border bg-white p-2 shadow-sm">
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="mt-3 rounded-2xl border border-sidebar-border bg-white p-2 shadow-sm">
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
