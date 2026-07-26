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
  /** On dark backgrounds (hero photos) both lines render white — gold blends into the photos. */
  dark?: boolean;
  /** Override the script line color (e.g. text-white over hero photos). */
  scriptClassName?: string;
  className?: string;
}

/**
 * Two-tier headline matching the original rentatexhibit.com typography:
 * a handwritten script intro line above an all-caps letter-spaced sans line,
 * with a short gold rule beneath (except the home hero).
 *
 * The script line is decorative flourish, not part of the page title — it
 * renders as a sibling paragraph OUTSIDE the heading element so the
 * accessible/SEO heading text is the caps line only (no "Find Your Fit The
 * Exhibit Apartment Guide" run-ons in the accessibility tree or SERPs).
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
    <div className={`${centered ? 'text-center' : 'text-left'} ${className}`}>
      {script && (
        <p
          className={`headline-script block ${scriptClassName ?? (dark ? 'text-white' : 'text-foreground')}`}
        >
          {script}
        </p>
      )}
      {caps && (
        <Tag className={`headline-caps block ${dark ? 'text-white' : ''}`}>{caps}</Tag>
      )}
      {underline && (
        <span className={`headline-rule ${centered ? 'mx-auto' : ''}`} aria-hidden="true" />
      )}
    </div>
  );
}
