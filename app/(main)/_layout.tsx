import { Stack } from 'expo-router';
import { theme } from '../../src/utils/theme';

export default function MainLayout() {
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
        name="index"
        options={{ title: 'My Projects' }}
      />
      <Stack.Screen
        name="project/create"
        options={{ title: 'New Project', presentation: 'modal' }}
      />
      <Stack.Screen
        name="project/[id]"
        options={{ title: 'Project' }}
      />
      <Stack.Screen
        name="labour/add"
        options={{ title: 'Add Labour', presentation: 'modal' }}
      />
      <Stack.Screen
        name="labour/[id]"
        options={{ title: 'Labour Details' }}
      />
      <Stack.Screen
        name="attendance/mark"
        options={{ title: 'Mark Attendance', presentation: 'modal' }}
      />
      <Stack.Screen
        name="payment/add"
        options={{ title: 'Add Payment', presentation: 'modal' }}
      />
    </Stack>
  );
}
