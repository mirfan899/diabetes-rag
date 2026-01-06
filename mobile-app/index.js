/**
 * @format
 */
console.error('INDEX.JS LOADED');
console.error('Importing gesture-handler...');
import 'react-native-gesture-handler';
console.error('Importing AppRegistry...');
import { AppRegistry } from 'react-native';
console.error('Importing App component...');
import App from './App';
console.error('Importing appName...');
import { name as appName } from './app.json';

console.error('Registering component...');
AppRegistry.registerComponent(appName, () => {
    console.error('[index.js] App factory called');
    return App;
});
console.error('index.js evaluation finished');
