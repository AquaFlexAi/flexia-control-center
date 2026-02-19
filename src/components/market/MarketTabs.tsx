'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MarketTabs({ isAuthorized }: { isAuthorized: boolean }) {
    const pathname = usePathname();

    const tabs = [
        { id: 'overview', label: 'Overview', href: '/market/overview' },
        { id: 'staking', label: 'Staking', href: '/market/staking' },
        { id: 'swap', label: 'Swap', href: '/market/swap' },
    ];

    if (isAuthorized) {
        tabs.push({ id: 'management', label: 'Management', href: '/market/management' });
    }

    return (
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800/50 backdrop-blur-sm self-start md:self-center">
            {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                    <Link
                        key={tab.id}
                        href={tab.href}
                        className={`px-5 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wider
                            ${isActive
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </div>
    );
}
