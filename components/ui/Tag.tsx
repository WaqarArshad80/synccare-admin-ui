import type { HTMLAttributes } from 'react';

type Tone = 'accent' | 'accent-2' | 'neutral' | 'outline';

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

/** Modernist tag — maps to the .tag / .tag-* classes in globals.css. */
export function Tag({ tone = 'neutral', className = '', ...props }: TagProps) {
  return <span className={`tag tag-${tone} ${className}`.trim()} {...props} />;
}
