
import { useState, useEffect } from 'react';

const mockWebApp = {
  ready: () => {},
  expand: () => {},
  setHeaderColor: (color: string) => console.log('Set Header Color:', color),
  setBackgroundColor: (color: string) => console.log('Set Background Color:', color),
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy') => console.log('Haptic:', style),
    selectionChanged: () => console.log('Haptic Selection Changed'),
  },
  showAlert: (message: string) => alert(message),
  MainButton: {
    show: () => console.log('MainButton Show'),
    hide: () => console.log('MainButton Hide'),
    showProgress: () => console.log('MainButton Show Progress'),
    hideProgress: () => console.log('MainButton Hide Progress'),
    setText: (text: string) => console.log('MainButton Set Text:', text),
    onClick: (callback: () => void) => console.log('MainButton onClick registered'),
    off: (callback: () => void) => console.log('MainButton onClick unregistered'),
  },
  initData: 'query_id=TEST_QUERY_ID&user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Test%22%2C%22last_name%22%3A%22User%22%2C%22username%22%3A%22testuser%22%2C%22language_code%22%3A%22en%22%7D&auth_date=1672444800&hash=TEST_HASH',
  close: () => console.log('WebApp closed'),
};

export function useTelegram() {
  const [webApp, setWebApp] = useState<any>(null);

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
      setWebApp(window.Telegram.WebApp);
    } else {
      console.warn("Telegram WebApp script not found, using mock object for development.");
      setWebApp(mockWebApp);
    }
  }, []);

  return webApp;
}
