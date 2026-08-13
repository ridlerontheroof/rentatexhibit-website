// Shared day-and-time picker for the showing scheduler — the single source of
// slot-grid logic used by both /schedule-showing (specific apartment) and
// /schedule-a-tour (specific apartment OR the general "no specific apartment"
// tour). Pure presentation: the owning page runs the contact/book mutations
// and the fallback state machine.
import type { RefObject } from 'react';
import { CalendarClock } from 'lucide-react';
import { formatSlotDate, formatSlotTime, type ShowingSlot } from '../../hooks/use-showings';

export interface SlotDay {
  date: string;
  slots: ShowingSlot[];
}

interface SlotPickerProps {
  /** Slots query still loading. */
  isPending: boolean;
  /** Days from the slots endpoint (undefined while loading/errored). */
  days: SlotDay[] | undefined;
  selectedSlot: ShowingSlot | null;
  onSelectSlot: (slot: ShowingSlot) => void;
  onConfirm: () => void;
  confirmPending: boolean;
  /** Extra disable (e.g. offline). */
  confirmDisabled?: boolean;
  /**
   * What the selection is for, shown before the chosen time — e.g.
   * "In-person showing of Apartment 2801" or "Your tour of Exhibit On
   * Superior". Never name the internal tour unit here.
   */
  selectionLabel: string;
  slotTakenNotice: boolean;
  slotTakenRef: RefObject<HTMLDivElement | null>;
  /** Copy + action for the no-open-times state (lead-capture fallback). */
  noSlotsMessage: string;
  noSlotsActionLabel: string;
  onNoSlotsAction: () => void;
}

export function SlotPicker({
  isPending,
  days,
  selectedSlot,
  onSelectSlot,
  onConfirm,
  confirmPending,
  confirmDisabled,
  selectionLabel,
  slotTakenNotice,
  slotTakenRef,
  noSlotsMessage,
  noSlotsActionLabel,
  onNoSlotsAction,
}: SlotPickerProps) {
  return (
    <>
      {slotTakenNotice && (
        <div
          ref={slotTakenRef}
          tabIndex={-1}
          className="mb-6 border border-destructive bg-destructive/10 p-4 text-destructive focus:outline-none focus:ring-2 focus:ring-ring"
          role="alert"
        >
          That time was just booked by someone else. Please pick another time below.
        </div>
      )}

      {isPending && (
        <p className="py-8 text-center" role="status" aria-live="polite">
          <CalendarClock className="mr-2 inline-block h-5 w-5 text-primary" aria-hidden />
          Loading available times…
        </p>
      )}

      {days &&
        (days.some((d) => d.slots.length > 0) ? (
          <div className="space-y-8">
            {days
              .filter((d) => d.slots.length > 0)
              .map((day) => (
                <div key={day.date}>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider">
                    {formatSlotDate(day.date)}
                  </h3>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {day.slots.map((slot) => {
                      const selected =
                        selectedSlot?.time === slot.time && selectedSlot.agentId === slot.agentId;
                      return (
                        <button
                          key={`${slot.time}-${slot.agentId}`}
                          type="button"
                          onClick={() => onSelectSlot(slot)}
                          aria-pressed={selected}
                          className={`border px-2 py-2 text-sm transition-colors ${
                            selected
                              ? 'border-primary bg-primary text-white'
                              : 'border-border bg-white hover:border-primary hover:text-primary'
                          }`}
                        >
                          {formatSlotTime(slot.time)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

            <div className="border-t border-border pt-6 text-center">
              {selectedSlot && (
                <p className="mb-4">
                  {selectionLabel} —{' '}
                  <strong>
                    {formatSlotDate(selectedSlot.time.slice(0, 10))} at{' '}
                    {formatSlotTime(selectedSlot.time)}
                  </strong>
                </p>
              )}
              <button
                type="button"
                onClick={onConfirm}
                disabled={!selectedSlot || confirmPending || confirmDisabled}
                className="btn-gold-outline border-primary bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {confirmPending ? 'Booking…' : 'Confirm Appointment'}
              </button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="mb-6">{noSlotsMessage}</p>
            <button type="button" onClick={onNoSlotsAction} className="btn-gold-outline">
              {noSlotsActionLabel}
            </button>
          </div>
        ))}
    </>
  );
}
