'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import {
    Users,
    Calendar,
    MessageSquare,
    UserSearch,
} from 'lucide-react';

const summaryCards = [
    {
        title: 'Total Contacts',
        value: '—',
        description: 'Premier dealers on file',
        icon: Users,
        color: 'var(--solatube-blue)',
    },
    {
        title: 'Upcoming Events',
        value: '—',
        description: 'Published events',
        icon: Calendar,
        color: 'var(--solatube-gold)',
    },
    {
        title: 'Pending Requests',
        value: '—',
        description: 'Awaiting approval',
        icon: MessageSquare,
        color: '#ef4444',
    },
    {
        title: 'Active Prospects',
        value: '—',
        description: 'In recruitment pipeline',
        icon: UserSearch,
        color: '#22c55e',
    },
];

export default function DashboardPage() {
    const { user } = useAuth();

    return (
        <div className="space-y-8">
            {/* Welcome */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back{user?.displayName ? `, ${user.displayName}` : ''}
                </h1>
                <p className="mt-1 text-muted-foreground">
                    Here&apos;s an overview of your Premier Dealer Portal.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {summaryCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card key={card.title} className="relative overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {card.title}
                                </CardTitle>
                                <div
                                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                                    style={{ backgroundColor: `${card.color}15` }}
                                >
                                    <Icon className="h-4 w-4" style={{ color: card.color }} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{card.value}</div>
                                <p className="text-xs text-muted-foreground">{card.description}</p>
                            </CardContent>
                            <div
                                className="absolute bottom-0 left-0 h-1 w-full"
                                style={{ backgroundColor: card.color }}
                            />
                        </Card>
                    );
                })}
            </div>

            {/* Placeholder for future widgets */}
            <Card>
                <CardContent className="flex h-48 items-center justify-center">
                    <p className="text-muted-foreground">
                        Dashboard widgets will be populated as features are built.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
