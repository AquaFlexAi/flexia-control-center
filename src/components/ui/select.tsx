import * as React from "react"
import { cn } from "@/lib/utils"

type SelectContextValue = {
    value: string
    setValue: (value: string) => void
    open: boolean
    setOpen: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

export interface SelectProps {
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    children: React.ReactNode
}

export function Select({ value, defaultValue, onValueChange, children }: SelectProps) {
    const [internal, setInternal] = React.useState(defaultValue ?? "")
    const [open, setOpen] = React.useState(false)
    const currentValue = value ?? internal

    const setValue = React.useCallback(
        (next: string) => {
            if (value == null) setInternal(next)
            onValueChange?.(next)
            setOpen(false)
        },
        [value, onValueChange]
    )

    return (
        <SelectContext.Provider value={{ value: currentValue, setValue, open, setOpen }}>
            <div className="relative">{children}</div>
        </SelectContext.Provider>
    )
}

export function SelectTrigger({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    const ctx = React.useContext(SelectContext)
    if (!ctx) return null

    return (
        <button
            type="button"
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            onClick={() => ctx.setOpen(!ctx.open)}
            {...props}
        />
    )
}

export interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {
    placeholder?: string
}

export function SelectValue({ className, placeholder = "Select", ...props }: SelectValueProps) {
    const ctx = React.useContext(SelectContext)
    if (!ctx) return null

    return (
        <span className={cn("truncate", className)} {...props}>
            {ctx.value || placeholder}
        </span>
    )
}

export function SelectContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    const ctx = React.useContext(SelectContext)
    if (!ctx || !ctx.open) return null

    return (
        <div
            className={cn(
                "absolute z-50 mt-2 w-full rounded-md border border-input bg-popover p-1 text-popover-foreground shadow-md",
                className
            )}
            {...props}
        />
    )
}

export interface SelectItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    value: string
}

export function SelectItem({ className, value, disabled, children, ...props }: SelectItemProps) {
    const ctx = React.useContext(SelectContext)
    if (!ctx) return null

    const active = ctx.value === value

    return (
        <button
            type="button"
            disabled={disabled}
            className={cn(
                "flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
                active && "bg-accent text-accent-foreground",
                className
            )}
            onClick={() => ctx.setValue(value)}
            {...props}
        >
            {children}
        </button>
    )
}

