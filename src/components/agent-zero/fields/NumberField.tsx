import React from 'react';
import { Field, Section } from '../types';
import { FieldWrapper } from './FieldWrapper';

interface NumberFieldProps {
  section: Section;
  field: Field;
  onHover: (desc: string | null) => void;
  updateFieldValue: (sectionId: string, fieldId: string, value: any) => void;
  disabled?: boolean;
}

export const NumberField = ({ section, field, onHover, updateFieldValue, disabled }: NumberFieldProps) => {
  return (
    <FieldWrapper 
      title={field.title} 
      description={field.description} 
      onHover={onHover}
    >
      <input
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        type="number"
        value={field.value ?? 0}
        onChange={e => updateFieldValue(section.id, field.id, Number(e.target.value))}
        disabled={disabled}
      />
    </FieldWrapper>
  );
};
