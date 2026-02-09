import React from 'react';
import { Field, Section } from '../types';
import { FieldWrapper } from './FieldWrapper';

interface ButtonFieldProps {
  section: Section;
  field: Field;
  onHover: (desc: string | null) => void;
  disabled?: boolean;
}

export const ButtonField = ({ section, field, onHover, disabled }: ButtonFieldProps) => {
  return (
    <FieldWrapper 
      title={field.title} 
      description={field.description} 
      onHover={onHover}
    >
      <div className="flex justify-end">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 py-2"
          onClick={() => {
            if (disabled) return;
            const msg = `${field.title}`;
            if (typeof window !== 'undefined') window.alert(msg);
          }}
          disabled={disabled}
        >
          {field.value || field.title}
        </button>
      </div>
    </FieldWrapper>
  );
};
