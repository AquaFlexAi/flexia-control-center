import React from 'react';
import { Field, Section } from '../types';
import { FieldWrapper } from './FieldWrapper';

interface TextFieldProps {
  section: Section;
  field: Field;
  onHover: (desc: string | null) => void;
  updateFieldValue: (sectionId: string, fieldId: string, value: any) => void;
  disabled?: boolean;
}

export const TextField = ({ section, field, onHover, updateFieldValue, disabled }: TextFieldProps) => {
  return (
    <FieldWrapper 
      title={field.title} 
      description={field.description} 
      onHover={onHover}
    >
      <input
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        type="text"
        value={field.value ?? ''}
        onChange={e => updateFieldValue(section.id, field.id, e.target.value)}
        disabled={disabled}
      />
    </FieldWrapper>
  );
};
