import { useRef, type RefObject } from 'react';

/**
 * Invisible bot protection for the public lead forms (contact, tour request,
 * showing scheduler). Two zero-friction signals the api-server checks before
 * accepting a submission:
 *
 *  - a honeypot "company" text input rendered off-screen — humans never see
 *    or fill it, form-spam bots fill everything;
 *  - the time between the form mounting and the submit — scripted posts are
 *    near-instant, people take seconds.
 *
 * Usage: `const guard = useBotGuard()` in the form component, render
 * `<HoneypotField inputRef={guard.companyRef} />` inside the <form>, and
 * spread `...guard.collect()` into the submission payload.
 */
export function useBotGuard() {
  // Mount time, not render time: useRef initializes once per form visit.
  const openedAtRef = useRef<number>(Date.now());
  const companyRef = useRef<HTMLInputElement>(null);

  const collect = () => ({
    company: companyRef.current?.value ?? '',
    elapsedMs: Date.now() - openedAtRef.current,
  });

  return { companyRef, collect };
}

export function HoneypotField({ inputRef }: { inputRef: RefObject<HTMLInputElement | null> }) {
  return (
    // Off-screen, not display:none — some bots skip fields they can tell are
    // hidden. aria-hidden + tabIndex -1 keep it out of the accessibility tree
    // and the keyboard order, so real visitors never encounter it.
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label htmlFor="company-field">Company (leave this blank)</label>
      <input
        ref={inputRef}
        type="text"
        id="company-field"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  );
}
