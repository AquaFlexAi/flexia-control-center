import { cn } from '@/lib/utils';
import React from 'react';

interface FieldWrapperProps {
  children: React.ReactNode;
  className?: string;
  description?: string;
  title?: string; // Made optional to be safe, but we'll pass it
  onHover: (desc: string | null) => void;
}

export const FieldWrapper = ({ children, className, description, title, onHover }: FieldWrapperProps) => (
  <div 
    className={cn(
      "flex flex-row items-start justify-between py-6 border-b border-border/40 last:border-0 hover:bg-muted/5 transition-colors px-2", 
      className
    )}
    onMouseEnter={() => onHover(description || null)}
    onMouseLeave={() => onHover(null)}
  >
    <div className="flex flex-col space-y-1.5 max-w-[50%] pr-6">
      {title && (
        <label className="text-sm font-medium leading-none text-foreground/90">
          {title}
        </label>
      )}
      {description && (
        <p className="text-[0.8rem] text-muted-foreground/80 leading-relaxed">
          {description}
        </p>
      )}
    </div>
    <div className="flex-1 max-w-[50%] flex justify-end">
      <div className="w-full">
        {children}
      </div>
    </div>
  </div>
);

// Deprecated but kept for compatibility if needed during migration, though we'll remove usage.
export const FieldLabel = ({ title }: { title: string }) => (
  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground/90">
    {title}
  </label>
);
