import { Stack } from 'expo-router';
import { theme } from '../../src/utils/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen
        name="phone"
        options={{ title: 'Login', headerShown: false }}
      />
      <Stack.Screen
        name="verify"
        options={{ title: 'Verify OTP', headerBackTitle: 'Back' }}
      />
    </Stack>
  );
}
