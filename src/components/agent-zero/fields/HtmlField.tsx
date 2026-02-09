import React from 'react';
import { Field } from '../types';

interface HtmlFieldProps {
  field: Field;
}

export const HtmlField = ({ field }: HtmlFieldProps) => {
  // HtmlField might be a special case where we want full width
  return (
    <div className="py-4 border-b border-border/40 last:border-0">
       <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground text-sm" dangerouslySetInnerHTML={{ __html: field.value || '' }} />
    </div>
  );
};
