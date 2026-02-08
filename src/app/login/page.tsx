"use client";

import React, { useState } from "react";
import { Activity, Shield, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push("/");
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-float" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-float" style={{ animationDelay: "-3s" }} />

            <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in zoom-in duration-700">
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 accent-gradient rounded-2xl flex items-center justify-center shadow-2xl transform rotate-12 scale-110 mb-6">
                        <Activity className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white italic">FLEXIA</h1>
                    <p className="text-muted-foreground font-medium uppercase tracking-[0.3em] text-[10px]">Cloud Orchestration Hub</p>
                </div>

                <div className="glass-card !p-8 space-y-6 bg-white/[0.03]">
                    <div className="space-y-2 text-center mb-4">
                        <h2 className="text-xl font-bold text-white">Welcome Back</h2>
                        <p className="text-sm text-muted-foreground">Sign in to manage your AI fleet</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase pl-1 tracking-wider">Work Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-purple-400 transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@company.com"
                                        required
                                        className="w-full bg-white/5 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all placeholder:text-muted-foreground/30"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center pl-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Password</label>
                                    <Link href="#" className="text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors">Forgot Password?</Link>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-purple-400 transition-colors" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full bg-white/5 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all placeholder:text-muted-foreground/30"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <p className="text-xs text-rose-500 font-medium text-center bg-rose-500/10 py-2 rounded-lg border border-rose-500/20">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full accent-gradient py-4 rounded-xl font-bold text-white shadow-xl shadow-purple-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In to Dashboard"}
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </form>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest leading-none bg-transparent">
                            <span className="bg-[#030303] px-4 text-muted-foreground/40">Enterprise Only</span>
                        </div>
                    </div>

                    <button className="w-full glass py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                        Use SSO Provider <Shield className="w-4 h-4 text-blue-400" />
                    </button>
                </div>

                <p className="text-center text-xs text-muted-foreground opacity-50">
                    By signing in, you agree to the <Link href="#" className="underline">Terms of Service</Link>
                </p>
            </div>
        </div>
    );
}
