import React from 'react';
import { Field, Section } from '../types';
import { FieldWrapper } from './FieldWrapper';

interface TextareaFieldProps {
  section: Section;
  field: Field;
  onHover: (desc: string | null) => void;
  updateFieldValue: (sectionId: string, fieldId: string, value: any) => void;
  disabled?: boolean;
}

const parseStyleString = (style?: string) => {
  if (!style) return undefined;
  const entries = style.split(';').map(s => s.trim()).filter(Boolean);
  const obj: Record<string, string> = {};
  entries.forEach(pair => {
    const idx = pair.indexOf(':');
    if (idx > -1) {
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      obj[key as any] = val;
    }
  });
  return obj;
};

export const TextareaField = ({ section, field, onHover, updateFieldValue, disabled }: TextareaFieldProps) => {
  const styleObj = parseStyleString(field.style);
  return (
    <FieldWrapper 
      title={field.title} 
      description={field.description} 
      onHover={onHover}
    >
      <textarea
        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono leading-normal"
        value={field.value ?? ''}
        onChange={e => updateFieldValue(section.id, field.id, e.target.value)}
        style={styleObj}
        spellCheck={false}
        disabled={disabled}
      />
    </FieldWrapper>
  );
};
