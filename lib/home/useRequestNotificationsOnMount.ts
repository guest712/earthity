import { useEffect } from 'react';

import { requestNotificationPermissions } from '../notifications';

export function useRequestNotificationsOnMount() {
  useEffect(() => {
    void requestNotificationPermissions();
  }, []);
}
