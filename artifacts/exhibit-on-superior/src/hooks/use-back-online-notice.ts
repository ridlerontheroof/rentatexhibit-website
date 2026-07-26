import { useCallback, useEffect, useRef, useState } from 'react';
import { useOnlineStatus } from './use-online-status';

/**
 * Returns [showBackOnline, dismiss] — the flag turns on when the browser
 * transitions from offline back to online so forms can show a "You're back
 * online" notice. The notice persists until the caller dismisses it (e.g. the
 * visitor clicks Dismiss or starts interacting with the form) rather than
 * disappearing on a timer (WCAG 2.2.1 Timing Adjustable). It also hides
 * automatically if the browser drops offline again.
 */
export const useBackOnlineNotice = () => {
  const isOnline = useOnlineStatus();
  const [showBackOnline, setShowBackOnline] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      setShowBackOnline(false);
    } else if (wasOffline.current) {
      wasOffline.current = false;
      setShowBackOnline(true);
    }
  }, [isOnline]);

  const dismiss = useCallback(() => setShowBackOnline(false), []);

  return [showBackOnline, dismiss] as const;
};
