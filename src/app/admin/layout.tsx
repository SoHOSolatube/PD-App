'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
    LayoutDashboard,
    Users,
    Calendar,
    MessageSquare,
    LayoutTemplate,
    ClipboardList,
    Inbox,
    ShieldOff,
    UserSearch,
    BookOpen,
    MessagesSquare,
    Settings,
    Shield,
    LogOut,
    Menu,
    ChevronLeft,
} from 'lucide-react';

type TabId = 'premier-dealers' | 'pd-recruitment';

const premierDealerNav = [
    { href: '/admin/contacts', label: 'Contacts', icon: Users },
    { href: '/admin/events', label: 'Events', icon: Calendar },
    { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
    { href: '/admin/templates', label: 'Templates', icon: LayoutTemplate },
    { href: '/admin/surveys', label: 'Surveys', icon: ClipboardList },
    { href: '/admin/sms-inbox', label: 'SMS Inbox', icon: Inbox },
    { href: '/admin/suppression', label: 'Suppression', icon: ShieldOff },
];

const recruitmentNav = [
    { href: '/admin/prospects', label: 'Prospects', icon: UserSearch },
    { href: '/admin/playbook', label: 'Playbook', icon: BookOpen },
    { href: '/admin/conversations', label: 'Conversations', icon: MessagesSquare },
];

const sharedNav = [
    { href: '/admin/settings', label: 'Settings', icon: Settings },
    { href: '/admin/users-logs', label: 'Users & Logs', icon: Shield },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, role, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [activeTab, setActiveTab] = useState<TabId>('premier-dealers');
    const [mobileOpen, setMobileOpen] = useState(false);

    // Don't wrap the login page in ProtectedRoute
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    const handleLogout = async () => {
        await logout();
        router.push('/admin/login');
    };

    const handleTabChange = (tab: TabId) => {
        setActiveTab(tab);
        const firstRoute = tab === 'premier-dealers'
            ? '/admin/contacts'
            : '/admin/prospects';
        router.push(firstRoute);
    };

    const navItems = activeTab === 'premier-dealers' ? premierDealerNav : recruitmentNav;

    const SidebarContent = () => (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center gap-3 px-4">
                <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: 'var(--solatube-blue)' }}
                >
                    <span className="text-sm font-bold text-white">PD</span>
                </div>
                <div>
                    <h1 className="text-sm font-semibold text-sidebar-foreground">
                        Premier Dealer
                    </h1>
                    <p className="text-xs text-sidebar-foreground/60">Portal</p>
                </div>
            </div>

            <Separator className="bg-sidebar-border" />

            {/* Nav Items */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                                ? 'bg-sidebar-accent text-sidebar-primary'
                                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Shared Nav */}
            <div className="px-3 pb-2">
                <Separator className="mb-2 bg-sidebar-border" />
                {sharedNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                                ? 'bg-sidebar-accent text-sidebar-primary'
                                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </div>

            {/* User Info */}
            <div className="border-t border-sidebar-border p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-foreground">
                        {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-sidebar-foreground">
                            {user?.displayName || user?.email}
                        </p>
                        <Badge
                            variant="outline"
                            className="mt-0.5 border-sidebar-border text-[10px] text-sidebar-foreground/60"
                        >
                            {role || 'loading…'}
                        </Badge>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground"
                        title="Sign out"
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <ProtectedRoute>
            <div className="flex h-screen overflow-hidden">
                {/* Desktop Sidebar */}
                <aside className="hidden w-64 flex-shrink-0 bg-sidebar md:block">
                    <SidebarContent />
                </aside>

                {/* Main Content */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Top Bar */}
                    <header className="flex h-14 items-center border-b bg-background px-4">
                        {/* Mobile Menu */}
                        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="mr-2 md:hidden">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-64 bg-sidebar p-0">
                                <SidebarContent />
                            </SheetContent>
                        </Sheet>

                        {/* Tab Navigation */}
                        <div className="flex gap-1">
                            <button
                                onClick={() => handleTabChange('premier-dealers')}
                                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === 'premier-dealers'
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                style={
                                    activeTab === 'premier-dealers'
                                        ? { backgroundColor: 'color-mix(in oklch, var(--solatube-blue) 10%, transparent)' }
                                        : undefined
                                }
                            >
                                Premier Dealers
                            </button>
                            <button
                                onClick={() => handleTabChange('pd-recruitment')}
                                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === 'pd-recruitment'
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                style={
                                    activeTab === 'pd-recruitment'
                                        ? { backgroundColor: 'color-mix(in oklch, var(--solatube-blue) 10%, transparent)' }
                                        : undefined
                                }
                            >
                                PD Recruitment
                            </button>
                        </div>

                        <div className="flex-1" />

                        {/* Breadcrumb-like current page indicator */}
                        <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                            <ChevronLeft className="h-3 w-3" />
                            <span className="capitalize">
                                {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
                            </span>
                        </div>
                    </header>

                    {/* Page Content */}
                    <main className="flex-1 overflow-y-auto bg-background p-6">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
