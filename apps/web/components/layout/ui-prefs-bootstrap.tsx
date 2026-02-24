'use client';

import { useEffect } from 'react';
import { applyUiPrefsFromStorage } from '../../lib/ui-prefs';

export function UiPrefsBootstrap() {
  useEffect(() => {
    applyUiPrefsFromStorage();
  }, []);

  return null;
}
