// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_UNIT_FILTERS, type FilterableUnit, type UnitFilterState } from '../../data/unitFilters';
import { UnitFilterRow } from './UnitFilterRow';

const units: FilterableUnit[] = [
  {
    unit: '0606',
    bedrooms: 1,
    bathrooms: 1,
    sqft: null,
    availableOn: null,
  },
];

const activeFilters: UnitFilterState = {
  ...DEFAULT_UNIT_FILTERS,
  beds: '1 Bed',
};

function renderRow(state: UnitFilterState) {
  return render(
    <UnitFilterRow
      units={units}
      state={state}
      onChange={vi.fn()}
      onClear={vi.fn()}
      shownCount={1}
    />,
  );
}

describe('UnitFilterRow filtered-link copy control', () => {
  const writeText = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    writeText.mockReset();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    window.history.replaceState({}, '', '/available-units?ubeds=1%20Bed#available-units');
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('is absent when residence filters are inactive', () => {
    renderRow(DEFAULT_UNIT_FILTERS);

    expect(screen.queryByTestId('button-copy-filtered-view-link')).toBeNull();
  });

  it('copies the current filtered URL, confirms success, then resets after two seconds', async () => {
    writeText.mockResolvedValue(undefined);
    renderRow(activeFilters);

    const copyControl = screen.getByTestId('button-copy-filtered-view-link');
    expect(copyControl.tagName).toBe('BUTTON');
    expect(copyControl.getAttribute('type')).toBe('button');
    expect(screen.queryByRole('link', { name: /copy link to this view/i })).toBeNull();

    await act(async () => {
      fireEvent.click(copyControl);
    });

    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(copyControl.textContent).toContain('Copied');

    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(copyControl.textContent).toContain('Copied');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(copyControl.textContent).toContain('Copy link to this view');
  });

  it('shows an accessible, focused fallback without claiming success when the clipboard write fails', async () => {
    writeText.mockRejectedValue(new Error('Clipboard permission denied'));
    renderRow(activeFilters);

    const copyControl = screen.getByTestId('button-copy-filtered-view-link');
    await act(async () => {
      fireEvent.click(copyControl);
    });

    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(copyControl.textContent).toContain('Copy link to this view');
    expect(copyControl.textContent).not.toContain('Copied');

    const error = screen.getByRole('alert');
    expect(error.textContent).toContain('Couldn’t copy automatically');

    const fallback = screen.getByLabelText('Filtered residence link') as HTMLInputElement;
    expect(fallback.readOnly).toBe(true);
    expect(fallback.value).toBe(window.location.href);
    expect(document.activeElement).toBe(fallback);
    expect(fallback.selectionStart).toBe(0);
    expect(fallback.selectionEnd).toBe(fallback.value.length);
  });

  it('keeps the success confirmation path free of failure feedback', async () => {
    writeText.mockResolvedValue(undefined);
    renderRow(activeFilters);

    await act(async () => {
      fireEvent.click(screen.getByTestId('button-copy-filtered-view-link'));
    });

    expect(screen.getByTestId('button-copy-filtered-view-link').textContent).toContain('Copied');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByLabelText('Filtered residence link')).toBeNull();
  });
});