import { 
  MessageSquarePlus, 
  RotateCcw, 
  Save, 
  Upload, 
  Settings, 
  Cpu, 
  LayoutDashboard, 
  RefreshCw,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  contexts: string[];
  currentContext: string | null;
  onSelectContext: (contextId: string) => void;
  onNewChat: () => void;
  onResetChat: () => void;
  onLoadChat?: () => void;
  onSaveChat?: () => void;
  onRestart?: () => void;
  onSettings?: () => void;
  onMemory?: () => void;
  onDashboard?: () => void;
}

export function ChatSidebar({
  contexts,
  currentContext,
  onSelectContext,
  onNewChat,
  onResetChat,
  onLoadChat,
  onSaveChat,
  onRestart,
  onSettings,
  onMemory,
  onDashboard
}: ChatSidebarProps) {
  const Button = ({ onClick, children, className, variant = "outline" }: any) => {
    const baseClass = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    const variants: any = {
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    };
    return (
      <button 
        onClick={onClick} 
        className={cn(baseClass, variants[variant] || variants.outline, "h-9 px-3", className)}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="w-64 border-r bg-muted/20 flex flex-col h-full shrink-0">
      <div className="p-4 grid grid-cols-2 gap-2">
        <Button onClick={onResetChat} className="justify-start w-full">
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <Button onClick={onNewChat} className="justify-start w-full">
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          New
        </Button>
        <Button onClick={onLoadChat} className="justify-start w-full">
          <Upload className="mr-2 h-4 w-4" />
          Load
        </Button>
        <Button onClick={onSaveChat} className="justify-start w-full">
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
        <Button onClick={onRestart} className="justify-start w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Restart
        </Button>
        <Button onClick={onSettings} className="justify-start w-full">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
        <Button onClick={onMemory} className="justify-start w-full">
          <Cpu className="mr-2 h-4 w-4" />
          Memory
        </Button>
        <Button onClick={onDashboard} className="justify-start w-full">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dash
        </Button>
      </div>

      <div className="px-4 py-2 text-sm font-semibold text-muted-foreground">
        Chats
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {contexts.length === 0 ? (
          <div className="text-sm text-muted-foreground px-2 py-4 italic text-center">
            No chats to list.
          </div>
        ) : (
          contexts.map((ctx) => (
            <button
              key={ctx}
              onClick={() => onSelectContext(ctx)}
              className={cn(
                "w-full flex items-center justify-start rounded-md px-3 py-2 text-sm font-medium transition-colors",
                currentContext === ctx 
                  ? "bg-secondary text-secondary-foreground" 
                  : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
              )}
            >
              <MessageSquare className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">{ctx.substring(0, 8)}...</span>
            </button>
          ))
        )}
      </div>

      <div className="p-4 text-xs text-muted-foreground border-t bg-background">
        Version F v0.9.7-13
      </div>
    </div>
  );
}
