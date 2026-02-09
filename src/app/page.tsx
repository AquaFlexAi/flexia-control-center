"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Cpu,
  Globe,
  Zap,
  ArrowUpRight,
  Boxes,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ServiceControlCard } from "@/components/services/card";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      // Parallel fetch for performance
      const [statsRes, servicesRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/services')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats([
          { 
            label: "ACTIVE TOKENS", 
            value: statsData.tokens || "0", 
            change: "+12%", // In real app, calculate this
            icon: Zap, 
            color: "text-yellow-400", 
            bg: "bg-yellow-400/10", 
            changeColor: "text-emerald-400 bg-emerald-500/10" 
          },
          { 
            label: "COMPUTE USAGE", 
            value: statsData.compute || "0%", 
            change: "-5%", 
            icon: Cpu, 
            color: "text-blue-400", 
            bg: "bg-blue-400/10", 
            changeColor: "text-blue-400 bg-blue-500/10" 
          },
          { 
            label: "API UPTIME", 
            value: statsData.uptime || "99.99%", 
            change: "Live", 
            icon: Globe, 
            color: "text-emerald-400", 
            bg: "bg-emerald-400/10", 
            changeColor: "text-emerald-400 bg-emerald-500/10" 
          },
          { 
            label: "FLX CREDITS", 
            value: statsData.credits ? statsData.credits.toLocaleString() : "0", 
            change: "Live", 
            icon: Activity, 
            color: "text-purple-400", 
            bg: "bg-purple-400/10", 
            changeColor: "text-blue-400 bg-blue-500/10" 
          },
        ]);
      }

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData);
      }

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">System Overview</h1>
          <p className="text-muted-foreground">
            Monitor and manage your FlexIA ecosystem. Real-time data from {services.length} core services.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/services')}
            className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-lg shadow-purple-500/20"
          >
            Launch New Agent <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card p-6 relative overflow-hidden group">
            {/* Background Glow Effect */}
            <div className={cn("absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 transition-opacity blur-2xl", stat.color.replace('text-', 'bg-'))} />
            
            <div className="flex justify-between items-start mb-6">
              <div className={cn("p-2.5 rounded-lg border border-white/5", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full", stat.changeColor)}>
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-2">{stat.label}</p>
              <h3 className="text-3xl font-bold text-white tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Services Grid */}
      <div>
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Boxes className="w-5 h-5 text-purple-400" /> Core Services
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <ServiceControlCard 
              key={i} 
              service={service} 
              onRefresh={fetchData} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}


