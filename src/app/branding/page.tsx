"use client";

import React, { useState, useEffect } from "react";
import {
    Palette,
    Image as ImageIcon,
    Type,
    Save,
    RotateCcw,
    Check,
    Layout,
    Crown,
    Eye,
    Settings2,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

export default function BrandingPage() {
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState({
        title: "FlexIA Control",
        primaryColor: "#8b5cf6",
        logoPath: "/assets/flexia-logo.svg",
        footerText: "Property of FlexIA AI",
        theme: "glass-dark"
    });
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        async function fetchBranding() {
            const resp = await fetch('/api/branding');
            if (resp.ok) {
                const data = await resp.json();
                if (data) {
                    setConfig({
                        title: data.title,
                        primaryColor: data.primary_color,
                        logoPath: data.logo_path,
                        footerText: data.footer_text,
                        theme: data.theme
                    });
                }
            }
            setLoading(false);
        }
        fetchBranding();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const resp = await fetch('/api/branding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (!resp.ok) throw new Error("Failed to save branding");

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3 italic">
                        <Crown className="w-8 h-8 text-yellow-400 not-italic" /> BRANDING HUB
                    </h1>
                    <p className="text-muted-foreground font-medium">Customize the identity of your white-labeled FlexIA instances.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="accent-gradient px-6 py-3 rounded-xl font-bold text-white flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                >
                    {saving ? <Settings2 className="w-5 h-5 animate-spin" /> : success ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                    {saving ? "Deploying Assets..." : success ? "Branding Active" : "Save & Push Branding"}
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Editor Side */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="glass-card space-y-8">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            <Palette className="w-6 h-6 text-purple-400" /> Visual Identity
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Primary App Name</label>
                                <div className="relative">
                                    <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={config.title}
                                        onChange={(e) => setConfig({ ...config, title: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white font-medium focus:ring-2 focus:ring-purple-500/30 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Primary Accent Color</label>
                                <div className="flex gap-4">
                                    <input
                                        type="color"
                                        value={config.primaryColor}
                                        onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                                        className="w-12 h-12 rounded-xl bg-transparent border-none cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={config.primaryColor}
                                        onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-white font-mono text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Platform Logo (SVG/PNG)</label>
                            <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 bg-white/[0.02] hover:bg-white/5 transition-all cursor-pointer group">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-white">Click to upload new logo</p>
                                    <p className="text-xs text-muted-foreground mt-1">Accepts SVG, PNG, WebP (Max 2MB)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            <Layout className="w-6 h-6 text-blue-400" /> UI Preset Overlays
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            {['Glassmorphism', 'Neon Cyber', 'Deep Space'].map((t) => (
                                <button
                                    key={t}
                                    className={cn(
                                        "p-4 rounded-xl border transition-all text-center",
                                        config.theme === t.toLowerCase().replace(' ', '-') ? "border-purple-500 bg-purple-500/10 text-white" : "border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10"
                                    )}
                                    onClick={() => setConfig({ ...config, theme: t.toLowerCase().replace(' ', '-') })}
                                >
                                    <p className="text-sm font-bold">{t}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview Side */}
                <div className="space-y-6">
                    <div className="glass-card !bg-black sticky top-8 border-purple-500/20 shadow-2xl shadow-purple-500/5">
                        <div className="flex items-center gap-3 mb-8 opacity-40">
                            <Eye className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Real-time Preview</span>
                        </div>

                        <div className="space-y-10">
                            {/* Simulated Header */}
                            <div className="space-y-4">
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest pl-1">Dashboard Header</p>
                                <div className="h-16 rounded-xl border border-white/5 bg-white/[0.03] flex items-center px-6 gap-4">
                                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: config.primaryColor }} />
                                    <span className="font-black text-white italic tracking-tighter text-lg">{config.title.toUpperCase()}</span>
                                </div>
                            </div>

                            {/* Simulated Buttons */}
                            <div className="space-y-4">
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest pl-1">Action Elements</p>
                                <div className="flex gap-4">
                                    <div className="h-10 px-6 rounded-lg flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-white" style={{ background: `linear-gradient(to right, ${config.primaryColor}, #000)` }}>
                                        Primary Action
                                    </div>
                                    <div className="h-10 px-6 rounded-lg border flex items-center justify-center text-[10px] font-black uppercase tracking-widest" style={{ borderColor: config.primaryColor, color: config.primaryColor }}>
                                        Secondary
                                    </div>
                                </div>
                            </div>

                            {/* Simulated Cards */}
                            <div className="space-y-4">
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest pl-1">Card Accentuation</p>
                                <div className="p-6 rounded-2xl border bg-white/[0.02] border-white/5" style={{ borderLeft: `4px solid ${config.primaryColor}` }}>
                                    <div className="w-12 h-2 rounded bg-white/10 mb-2" />
                                    <div className="w-24 h-4 rounded bg-white/5" />
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-white/5 text-center">
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.3em]">{config.footerText}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
