"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  Cpu,
  Globe,
  Zap,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Boxes,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

export default function DashboardPage() {
  const [stats, setStats] = useState<any[]>([]);
  const [coreServices, setCoreServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      // Fetch services
      const { data: services } = await supabase.from('services').select('*');
      const { data: credits } = await supabase.from('organization_credits').select('balance').single();

      if (services) {
        setCoreServices(services);

        // Mock dynamic stats based on real data
        setStats([
          { label: "Active Tokens", value: "1.2M", change: "+12%", icon: Zap, color: "text-yellow-400" },
          { label: "Compute Usage", value: "64%", change: "-5%", icon: Cpu, color: "text-blue-400" },
          { label: "Api Uptime", value: "99.98%", change: "+0.01%", icon: Globe, color: "text-emerald-400" },
          { label: "FLX Credits", value: credits?.balance?.toLocaleString() || "0", change: "Live", icon: Activity, color: "text-purple-400" },
        ]);
      }
      setLoading(false);
    }

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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">System Overview</h1>
          <p className="text-muted-foreground max-w-lg">
            Monitor and manage your FlexIA ecosystem. Real-time data from {coreServices.length} core services.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="accent-gradient text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20">
            Launch New Agent <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card group cursor-default">
            <div className="flex justify-between items-start mb-4">
              <div className={stat.color}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", i % 2 === 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400")}>
                {stat.change}
              </span>
            </div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-2xl font-bold text-white mt-1 group-hover:text-purple-400 transition-colors">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Services Grid */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Boxes className="w-5 h-5 text-purple-400" /> Core Services
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {coreServices.map((service, i) => (
            <div key={i} className="glass-card flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white">{service.name}</h3>
                <div className={cn(
                  "flex items-center gap-1.5 text-[10px] font-bold uppercase",
                  service.status === 'online' ? "text-emerald-400" : "text-yellow-400"
                )}>
                  {service.status === 'online' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  {service.status}
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 italic">
                {service.type} deployment in {service.region}.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Instances</p>
                  <p className="text-sm font-semibold text-white">{service.instances}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Latency</p>
                  <p className="text-sm font-semibold text-white">45ms</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

