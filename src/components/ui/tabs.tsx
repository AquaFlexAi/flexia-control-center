import * as React from "react"
import { cn } from "@/lib/utils"

type TabsContextValue = {
    value: string
    setValue: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
}

export function Tabs({ value, defaultValue, onValueChange, className, children, ...props }: TabsProps) {
    const [internal, setInternal] = React.useState(defaultValue ?? "")
    const currentValue = value ?? internal

    const setValue = React.useCallback(
        (next: string) => {
            if (value == null) setInternal(next)
            onValueChange?.(next)
        },
        [value, onValueChange]
    )

    return (
        <TabsContext.Provider value={{ value: currentValue, setValue }}>
            <div className={cn("w-full", className)} {...props}>
                {children}
            </div>
        </TabsContext.Provider>
    )
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
                className
            )}
            {...props}
        />
    )
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    value: string
}

export function TabsTrigger({ className, value, onClick, ...props }: TabsTriggerProps) {
    const ctx = React.useContext(TabsContext)
    if (!ctx) return null

    const active = ctx.value === value

    return (
        <button
            type="button"
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                active && "bg-background text-foreground shadow-sm",
                className
            )}
            onClick={(e) => {
                ctx.setValue(value)
                onClick?.(e)
            }}
            {...props}
        />
    )
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string
}

export function TabsContent({ className, value, children, ...props }: TabsContentProps) {
    const ctx = React.useContext(TabsContext)
    if (!ctx || ctx.value !== value) return null

    return (
        <div className={cn("mt-2", className)} {...props}>
            {children}
        </div>
    )
}

