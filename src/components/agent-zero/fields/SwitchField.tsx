import React from 'react';
import { cn } from '@/lib/utils';
import { Field, Section } from '../types';
import { FieldWrapper } from './FieldWrapper';

interface SwitchFieldProps {
  section: Section;
  field: Field;
  onHover: (desc: string | null) => void;
  updateFieldValue: (sectionId: string, fieldId: string, value: any) => void;
  disabled?: boolean;
}

export const SwitchField = ({ section, field, onHover, updateFieldValue, disabled }: SwitchFieldProps) => {
  return (
    <FieldWrapper 
      title={field.title} 
      description={field.description} 
      onHover={onHover}
    >
      <div className="flex justify-end">
        <button
          type="button"
          role="switch"
          aria-checked={field.value}
          onClick={() => updateFieldValue(section.id, field.id, !field.value)}
          disabled={disabled}
          className={cn(
            "peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
            field.value ? "bg-primary" : "bg-input"
          )}
        >
          <span
            data-state={field.value ? "checked" : "unchecked"}
            className={cn(
              "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
              field.value ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>
    </FieldWrapper>
  );
};
