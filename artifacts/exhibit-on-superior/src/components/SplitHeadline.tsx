import type { ElementType } from 'react';

interface SplitHeadlineProps {
  /** Handwritten script intro line (Reenie Beanie). */
  script?: string;
  /** All-caps tracked main line(s). */
  caps?: string;
  /** Heading element to render. Defaults to h2. */
  as?: ElementType;
  /** Short gold rule under the headline. Defaults to true (omit only on the home hero). */
  underline?: boolean;
  align?: 'center' | 'left';
  /** On dark backgrounds the script line renders gold and the caps line white. */
  dark?: boolean;
  /** Override the script line color (e.g. text-white over hero photos). */
  scriptClassName?: string;
  className?: string;
}

/**
 * Two-tier headline matching the original rentatexhibit.com typography:
 * a handwritten script intro line above an all-caps letter-spaced sans line,
 * with a short gold rule beneath (except the home hero).
 */
export function SplitHeadline({
  script,
  caps,
  as: Tag = 'h2',
  underline = true,
  align = 'center',
  dark = false,
  scriptClassName,
  className = '',
}: SplitHeadlineProps) {
  const centered = align === 'center';
  return (
    <Tag className={`${centered ? 'text-center' : 'text-left'} ${className}`}>
      {script && (
        <span
          className={`headline-script block ${scriptClassName ?? (dark ? 'text-primary' : 'text-foreground')}`}
        >
          {script}
        </span>
      )}
      {caps && (
        <span className={`headline-caps block ${dark ? 'text-white' : ''}`}>{caps}</span>
      )}
      {underline && (
        <span className={`headline-rule ${centered ? 'mx-auto' : ''}`} aria-hidden="true" />
      )}
    </Tag>
  );
}
