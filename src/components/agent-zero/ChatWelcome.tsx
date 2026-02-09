import { 
  MessageSquarePlus, 
  Folder, 
  Cpu, 
  Settings, 
  Globe, 
  Github,
  Server,
  Gauge
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatWelcomeProps {
  onNewChat: () => void;
  onProjects?: () => void;
  onMemory?: () => void;
  onSettings?: () => void;
}

export function ChatWelcome({
  onNewChat,
  onProjects,
  onMemory,
  onSettings
}: ChatWelcomeProps) {
  const CardButton = ({ onClick, icon: Icon, title, description, href }: any) => {
    const content = (
      <>
        <Icon className="h-8 w-8 text-blue-500 mb-2" />
        <div className="space-y-1 text-center">
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground font-normal">{description}</div>
        </div>
      </>
    );

    const className = "h-32 flex flex-col items-center justify-center p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer w-full";

    if (href) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
          {content}
        </a>
      );
    }

    return (
      <button onClick={onClick} className={className}>
        {content}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full w-full p-4 md:p-6 overflow-y-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="space-y-1">
          <div className="text-sm text-green-500 font-mono">SYSTEM READY</div>
          <h1 className="text-2xl md:text-3xl font-bold">Welcome to Agent Zero</h1>
          <p className="text-sm text-muted-foreground">Agentic control center active. Awaiting command.</p>
        </div>
        <div className="grid grid-cols-2 md:flex items-center gap-2 w-full md:w-auto">
          <div className="border rounded-lg px-3 py-2 text-xs bg-background">
            <div className="flex items-center gap-1"><Server className="h-3 w-3" /> Status</div>
            <div className="font-mono text-green-500">ONLINE</div>
          </div>
          <div className="border rounded-lg px-3 py-2 text-xs bg-background">
            <div className="flex items-center gap-1"><Gauge className="h-3 w-3" /> Uptime</div>
            <div className="font-mono text-muted-foreground">4h 12m</div>
          </div>
          <div className="border rounded-lg px-3 py-2 text-xs bg-background">
            <div className="flex items-center gap-1"><Gauge className="h-3 w-3" /> Memory</div>
            <div className="font-mono text-muted-foreground">1.2GB</div>
          </div>
          <div className="border rounded-lg px-3 py-2 text-xs bg-background">
            <div className="flex items-center gap-1"><Gauge className="h-3 w-3" /> CPU</div>
            <div className="font-mono text-muted-foreground">12%</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <CardButton 
          onClick={onNewChat}
          icon={MessageSquarePlus}
          title="New Chat"
          description="Start a new conversation or task."
        />
        <CardButton 
          onClick={onProjects}
          icon={Folder}
          title="Projects"
          description="Manage your workspaces and files."
        />
        <CardButton 
          onClick={onMemory}
          icon={Cpu}
          title="Memory Bank"
          description="Explore agent knowledge and recall."
        />
        <CardButton 
          onClick={onSettings}
          icon={Settings}
          title="Configuration"
          description="System preferences and API keys."
        />
      </div>

      <div className="flex-1 rounded-lg border bg-card">
        <div className="flex items-center justify-between px-4 py-2 border-b text-xs">
          <div className="font-mono text-muted-foreground">SYSTEM_LOGS</div>
          <div className="text-muted-foreground">—</div>
        </div>
        <div className="p-4 text-sm font-mono space-y-2 text-muted-foreground">
          <div>10:42:01  INFO  System initialized successfully.</div>
          <div>10:42:05  INFO  Connected to Docker daemon.</div>
          <div>10:42:08  DEBUG Loaded 42 memory fragments.</div>
          <div>10:45:12  WARN  Update checker: New version available (v0.9.8).</div>
          <div>--:--:--  IDLE  _</div>
        </div>
      </div>
    </div>
  );
}
