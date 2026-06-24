/**
 * @format
 */

// Polyfill de URL requerido por @supabase/supabase-js en Hermes/React Native
// (sin esto, createClient lanza "Cannot assign to property 'protocol'").
import 'react-native-url-polyfill/auto';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
