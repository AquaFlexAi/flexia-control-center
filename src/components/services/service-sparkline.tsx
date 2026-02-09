"use client";

import React, { useEffect, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface ServiceSparklineProps {
    serviceId: string;
    color?: string;
}

export default function ServiceSparkline({ serviceId, color = "#60a5fa" }: ServiceSparklineProps) {
    const [data, setData] = useState<{ value: number }[]>([]);

    useEffect(() => {
        // Initial data
        const initialData = Array.from({ length: 20 }, () => ({
            value: Math.floor(Math.random() * 40) + 10
        }));
        setData(initialData);

        // Simulate live data updates
        const interval = setInterval(() => {
            setData(prev => {
                const newValue = Math.max(5, Math.min(95, prev[prev.length - 1].value + (Math.random() * 20 - 10)));
                const newData = [...prev.slice(1), { value: newValue }];
                return newData;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [serviceId]);

    return (
        <div className="w-24 h-8">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id={`gradient-${serviceId}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={color} 
                        strokeWidth={2} 
                        fill={`url(#gradient-${serviceId})`} 
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
