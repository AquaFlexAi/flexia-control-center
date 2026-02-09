import { LayoutDashboard, MessageSquare, Folder, Cpu, Settings, Grid2x2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

interface AppSidebarProps {
  onDashboard: () => void;
  onChat: () => void;
  onProjects?: () => void;
  onMemory?: () => void;
  onSettings?: () => void;
  className?: string;
}

export function AppSidebar({
  onDashboard,
  onChat,
  onProjects,
  onMemory,
  onSettings,
  className,
}: AppSidebarProps) {
  const Item = ({ icon: Icon, label, onClick, active = false }: any) => (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-12 h-12 flex items-center justify-center rounded-lg transition-colors",
        active ? "bg-primary/20 text-primary" : "hover:bg-muted hover:text-foreground text-muted-foreground"
      )}
      aria-label={label}
    >
      <Icon className="h-5 w-5" />
      <span className="absolute left-14 z-50 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-muted/80 text-foreground px-2 py-1 rounded-md pointer-events-none whitespace-nowrap">
        {label}
      </span>
    </button>
  );

  return (
    <aside className={cn("w-16 border-r bg-muted/10 flex flex-col items-center py-3 gap-2", className)}>
      <div className="w-10 h-10 rounded-lg bg-blue-600/90 text-white flex items-center justify-center font-bold shrink-0">AO</div>
      <Item icon={Grid2x2} label="Apps" onClick={onDashboard} />
      <Item icon={MessageSquare} label="Chat" onClick={onChat} />
      <Item icon={Folder} label="Projects" onClick={onProjects} />
      <Item icon={Cpu} label="Memory" onClick={onMemory} />
      <Item icon={Settings} label="Settings" onClick={onSettings} />
      <div className="mt-auto mb-2">
        <Item icon={LayoutDashboard} label="Dashboard" onClick={onDashboard} />
      </div>
      <div className="mb-1">
        <Item icon={Globe} label="Web" onClick={() => {}} />
      </div>
    </aside>
  );
}
