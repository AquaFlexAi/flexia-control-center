import React from 'react';
import { Field, Section } from '../types';
import { FieldWrapper } from './FieldWrapper';

interface RangeFieldProps {
  section: Section;
  field: Field;
  onHover: (desc: string | null) => void;
  updateFieldValue: (sectionId: string, fieldId: string, value: any) => void;
  disabled?: boolean;
}

export const RangeField = ({ section, field, onHover, updateFieldValue, disabled }: RangeFieldProps) => {
  return (
    <FieldWrapper 
      title={field.title} 
      description={field.description} 
      onHover={onHover}
    >
      <div className="flex flex-col space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">
            {field.min ?? 0}
          </span>
          <span className="text-xs font-mono text-primary font-bold border rounded px-2 py-0.5 bg-primary/10">
            {String(field.value)}
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            {field.max ?? 1}
          </span>
        </div>
        <input
          className="flex w-full h-2 rounded-lg appearance-none cursor-pointer bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          type="range"
          min={field.min ?? 0}
          max={field.max ?? 1}
          step={field.step ?? 0.01}
          value={field.value ?? 0}
          onChange={e => updateFieldValue(section.id, field.id, Number(e.target.value))}
          style={{ accentColor: 'hsl(var(--primary))' }}
          disabled={disabled}
        />
      </div>
    </FieldWrapper>
  );
};
