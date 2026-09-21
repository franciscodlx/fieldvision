import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AppConfig } from './src/shared/config';

LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);

export default function App(): React.JSX.Element {
  useEffect(() => {
    if (AppConfig.IS_DEV) {
      const placeholders = Object.entries(AppConfig)
        .filter(([, v]) => typeof v === 'string' && (v as string).includes('PLACEHOLDER'))
        .map(([k]) => k);
      if (placeholders.length > 0) {
        console.warn(
          `FieldVision: variables con PLACEHOLDER: ${placeholders.join(', ')}\n` +
          `   Ver docs/05-registrations.md para obtener claves reales.`
        );
      }
    }
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <AppNavigator />
    </>
  );
}
