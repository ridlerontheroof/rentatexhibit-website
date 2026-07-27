import { useRef, type FocusEvent, type KeyboardEvent, type RefObject } from 'react';

/**
 * Invisible bot protection for the public lead forms (contact, tour request,
 * showing scheduler). Two zero-friction signals the api-server checks before
 * accepting a submission:
 *
 *  - a honeypot text input rendered off-screen — humans never see or fill it,
 *    form-spam bots fill everything. The field name is a nonsense token
 *    (`xh_note`) with no label text, so browser profile autofill has nothing
 *    to map onto it. (The previous field was named "company" with a "Company"
 *    label — Safari filled it from the visitor's contact card and real
 *    submissions were rejected as bots.)
 *  - the time between the visitor's first *typing* in the form and the
 *    submit — scripted posts are near-instant, people take seconds. The timer
 *    starts at the first interaction with the form (not mount), and if the
 *    visitor never typed at all (pure browser autofill) `elapsedMs` is
 *    omitted entirely — the server tolerates a missing value.
 *
 * Usage: `const guard = useBotGuard()` in the form component, spread
 * `{...guard.formProps}` onto the <form>, render
 * `<HoneypotField inputRef={guard.honeypotRef} />` inside it, and spread
 * `...guard.collect()` into the submission payload.
 */
export function useBotGuard() {
  const honeypotRef = useRef<HTMLInputElement>(null);
  // First focus/interaction anywhere inside the form — the earliest moment a
  // human could plausibly have started filling it in.
  const firstInteractionAtRef = useRef<number | null>(null);
  // Whether the visitor actually typed. Browser autofill sets values without
  // key presses; in that case a fill-time measurement is meaningless and we
  // omit it rather than risk flagging a real visitor as "too fast".
  const typedRef = useRef(false);

  const markInteraction = () => {
    if (firstInteractionAtRef.current === null) firstInteractionAtRef.current = Date.now();
  };

  const formProps = {
    onFocusCapture: (_e: FocusEvent<HTMLFormElement>) => markInteraction(),
    onKeyDownCapture: (_e: KeyboardEvent<HTMLFormElement>) => {
      markInteraction();
      typedRef.current = true;
    },
  };

  const collect = (): { xh_note: string; elapsedMs?: number } => {
    const startedAt = firstInteractionAtRef.current;
    const base = { xh_note: honeypotRef.current?.value ?? '' };
    // Only report a fill time when the visitor actually typed — otherwise
    // (pure autofill / programmatic fill by an assistive tool) omit it.
    if (typedRef.current && startedAt !== null) {
      return { ...base, elapsedMs: Date.now() - startedAt };
    }
    return base;
  };

  return { honeypotRef, formProps, collect };
}

export function HoneypotField({ inputRef }: { inputRef: RefObject<HTMLInputElement | null> }) {
  return (
    // Off-screen, not display:none — some bots skip fields they can tell are
    // hidden. aria-hidden + tabIndex -1 keep it out of the accessibility tree
    // and the keyboard order, so real visitors never encounter it. No label
    // and a nonsense field name so browser autofill heuristics never map a
    // profile value onto it.
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <input
        ref={inputRef}
        type="text"
        id="xh-note-field"
        name="xh_note"
        // Accessible-name for the prerender link-names guard only — the whole
        // wrapper is aria-hidden so nothing is ever announced. Deliberately
        // NOT a <label>: visible/associated label text ("Company") is what
        // let Safari profile-autofill fill the old honeypot.
        aria-label="Leave this field empty"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  );
}
