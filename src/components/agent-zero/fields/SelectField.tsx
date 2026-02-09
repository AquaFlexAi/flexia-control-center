import React from 'react';
import { Field, Section } from '../types';
import { FieldWrapper } from './FieldWrapper';

interface SelectFieldProps {
  section: Section;
  field: Field;
  onHover: (desc: string | null) => void;
  updateFieldValue: (sectionId: string, fieldId: string, value: any) => void;
  disabled?: boolean;
}

export const SelectField = ({ section, field, onHover, updateFieldValue, disabled }: SelectFieldProps) => {
  return (
    <FieldWrapper 
      title={field.title} 
      description={field.description} 
      onHover={onHover}
    >
      <div className="relative">
        <select
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none shadow-sm"
          value={field.value ?? ''}
          onChange={e => updateFieldValue(section.id, field.id, e.target.value)}
          disabled={disabled}
        >
          {(field.options || []).map(opt => (
            <option key={opt.value} value={opt.value} className="bg-popover text-popover-foreground">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-2.5 pointer-events-none opacity-50">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </FieldWrapper>
  );
};
