"use client";

import React, { useEffect, useState } from 'react';
import {
    AreaChart,
    Area,
    ResponsiveContainer,
    Tooltip
} from 'recharts';

interface SparklineProps {
    serviceId: string;
    color?: string;
}

export default function ServiceSparkline({ serviceId, color = "#8b5cf6" }: SparklineProps) {
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        async function fetchTelemetry() {
            try {
                const resp = await fetch(`/api/telemetry?serviceId=${serviceId}`);
                if (resp.ok) {
                    const json = await resp.json();
                    setData(json.history);
                }
            } catch (err) {
                console.error("Failed to fetch telemetry", err);
            }
        }

        fetchTelemetry();
        const interval = setInterval(fetchTelemetry, 10000); // Update every 10s
        return () => clearInterval(interval);
    }, [serviceId]);

    if (data.length === 0) return (
        <div className="h-10 w-32 bg-white/5 rounded-lg animate-pulse" />
    );

    return (
        <div className="h-12 w-48 group/chart relative">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id={`grad-${serviceId}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#grad-${serviceId})`}
                        isAnimationActive={false}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-black/80 border border-white/10 px-2 py-1 rounded text-[8px] text-white">
                                        <p className="font-bold">{payload[0].value}% Load</p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                        cursor={{ stroke: 'white', strokeWidth: 1, strokeDasharray: '2 2' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
