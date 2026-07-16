import { useEffect, useRef, useState } from 'react';
import { useOnlineStatus } from './use-online-status';

/**
 * Returns true for a few seconds after the browser transitions from
 * offline back to online, so forms can show a "You're back online" notice.
 */
export const useBackOnlineNotice = (durationMs = 5000) => {
  const isOnline = useOnlineStatus();
  const [showBackOnline, setShowBackOnline] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (!isOnline) {
      wasOffline.current = true;
      setShowBackOnline(false);
    } else if (wasOffline.current) {
      wasOffline.current = false;
      setShowBackOnline(true);
      timer = setTimeout(() => setShowBackOnline(false), durationMs);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOnline, durationMs]);

  return showBackOnline;
};
