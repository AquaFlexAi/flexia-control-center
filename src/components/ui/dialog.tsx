
import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const DialogContext = React.createContext<{
    open: boolean
    onOpenChange: (open: boolean) => void
}>({
    open: false,
    onOpenChange: () => { },
})

const Dialog: React.FC<{
    children: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}> = ({ children, open, onOpenChange }) => {
    const [isOpen, setIsOpen] = React.useState(false)

    const handleOpenChange = (value: boolean) => {
        setIsOpen(value)
        if (onOpenChange) onOpenChange(value)
    }

    // Sync prop to state if controlled
    React.useEffect(() => {
        if (open !== undefined) setIsOpen(open)
    }, [open])

    return (
        <DialogContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
            {children}
        </DialogContext.Provider>
    )
}

const DialogTrigger: React.FC<{
    children: React.ReactElement
    asChild?: boolean
}> = ({ children, asChild }) => {
    const { onOpenChange } = React.useContext(DialogContext)

    return React.cloneElement(children as React.ReactElement<any>, {
        onClick: (e: any) => {
            const child = children as React.ReactElement<any>;
            if (child.props && child.props.onClick) {
                child.props.onClick(e);
            }
            onOpenChange(true)
        }
    })
}

const DialogContent: React.FC<{
    children: React.ReactNode
    className?: string
}> = ({ children, className }) => {
    const { open, onOpenChange } = React.useContext(DialogContext)

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className={cn(
                    "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-800 bg-slate-950 p-6 shadow-2xl shadow-black/80 duration-200 animate-in zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%] sm:rounded-2xl",
                    className
                )}
            >
                {children}
                <button
                    className="absolute right-6 top-6 rounded-full p-1.5 bg-slate-900 border border-slate-800 text-slate-400 opacity-70 transition-all hover:opacity-100 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    onClick={() => onOpenChange(false)}
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>
            </div>
        </div>
    )
}

const DialogHeader: React.FC<{
    children: React.ReactNode
    className?: string
}> = ({ children, className }) => (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>
        {children}
    </div>
)

const DialogTitle: React.FC<{
    children: React.ReactNode
    className?: string
}> = ({ children, className }) => (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
        {children}
    </h2>
)

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger }
