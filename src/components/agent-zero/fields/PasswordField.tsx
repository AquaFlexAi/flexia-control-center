import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Field, Section } from '../types';
import { FieldWrapper } from './FieldWrapper';

interface PasswordFieldProps {
  section: Section;
  field: Field;
  onHover: (desc: string | null) => void;
  updateFieldValue: (sectionId: string, fieldId: string, value: any) => void;
  disabled?: boolean;
}

export const PasswordField = ({ section, field, onHover, updateFieldValue, disabled }: PasswordFieldProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <FieldWrapper 
      title={field.title} 
      description={field.description} 
      onHover={onHover}
    >
      <div className="relative">
        <input
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pr-10"
          type={visible ? 'text' : 'password'}
          value={field.value ?? ''}
          onChange={e => updateFieldValue(section.id, field.id, e.target.value)}
          disabled={disabled}
        />
        <button
          type="button"
          className="absolute right-0 top-0 h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          onClick={() => setVisible(v => !v)}
          disabled={disabled && false} // Allow viewing even if disabled? Or maybe not. Let's allow viewing.
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </FieldWrapper>
  );
};
