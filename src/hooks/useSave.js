import { useEffect, useRef, useState } from 'react';
import { saveAll } from '../utils/storage';

export function useAutoSave(data) {
  const [saveStatus, setSaveStatus] = useState('idle');
  const timerRef = useRef(null);
  const fadeRef = useRef(null);
  const lastSavedDataRef = useRef(null);

  useEffect(() => {
    // Skip if data hasn't changed
    const dataString = JSON.stringify(data);
    if (lastSavedDataRef.current === dataString) {
      return;
    }

    setSaveStatus('saving');
    clearTimeout(timerRef.current);
    clearTimeout(fadeRef.current);

    timerRef.current = setTimeout(() => {
      const success = saveAll(data);
      if (success) {
        lastSavedDataRef.current = dataString;
        setSaveStatus('saved');
        fadeRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        console.error('Failed to save data');
        fadeRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }, 500);

    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(fadeRef.current);
    };
  }, [data]);

  return saveStatus;
}
