console.error('[App.tsx] EVALUATING');
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import ResultScreen from './src/screens/ResultScreen';
import EulaScreen from './src/screens/EulaScreen';
import LoginScreen from './src/screens/LoginScreen';
import DoctorProfileScreen from './src/screens/DoctorProfileScreen';
import { RootStackParamList } from './src/types';
import { AuthService } from './src/services/auth';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  console.error('[App] function execution started');
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Eula');

  useEffect(() => {
    console.error('[App] useEffect checkState started');
    const checkState = async () => {
      try {
        console.error('[App] checking isEulaAccepted');
        const eulaAccepted = await AuthService.isEulaAccepted();
        if (!eulaAccepted) {
          setInitialRoute('Eula');
        } else {
          const authenticated = await AuthService.isAuthenticated();
          if (authenticated) {
            setInitialRoute('DoctorProfile');
          } else {
            setInitialRoute('Login');
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        console.error('[App] checkState finished, initialRoute:', initialRoute);
        setIsLoading(false);
      }
    };

    checkState();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute}>
          <Stack.Screen
            name="Eula"
            component={EulaScreen}
            options={{ title: 'License Agreement', headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'Login', headerShown: false }}
          />
          <Stack.Screen
            name="DoctorProfile"
            component={DoctorProfileScreen}
            options={{ title: 'Dashboard', headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Patient Consultation' }}
          />
          <Stack.Screen
            name="Result"
            component={ResultScreen}
            options={{ title: 'Recommendation' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
