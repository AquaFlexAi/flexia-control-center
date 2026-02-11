'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';

import { ASSET_CONFIG } from './constants';

interface AssetsChartProps {
    assets: Array<{
        asset_type: string;
        amount: number;
    }>;
}

export function AssetsChart({ assets }: AssetsChartProps) {
    const chartData = assets.map(a => ({
        name: a.asset_type,
        value: parseFloat(a.amount.toString()) * (a.asset_type === 'BTC' ? 65000 : a.asset_type === 'ETH' ? 3500 : 1)
    }));

    if (chartData.length === 0) chartData.push({ name: 'Empty', value: 1 });

    return (
        <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-800/50 h-full">
            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-4">Portfolio Allocation</h3>
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                    <Pie
                        data={chartData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={ASSET_CONFIG[entry.name]?.color || '#333'} />
                        ))}
                    </Pie>
                    <RechartsTooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                        itemStyle={{ color: '#e2e8f0' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
