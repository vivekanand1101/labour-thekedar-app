import { Stack } from 'expo-router';
import { theme } from '../../src/utils/theme';
import { useI18n } from '../../src/utils/i18n';

export default function MainLayout() {
  const { t } = useI18n();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: theme.colors.background },
        headerBackTitle: '',
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: t('myProjects') }}
      />
      <Stack.Screen
        name="project/create"
        options={{ title: t('newProject') }}
      />
      <Stack.Screen
        name="project/[id]"
        options={{ title: '' }}
      />
      <Stack.Screen
        name="labour/add"
        options={{ title: t('addLabour') }}
      />
      <Stack.Screen
        name="labour/[id]"
        options={{ title: '' }}
      />
      <Stack.Screen
        name="attendance/mark"
        options={{ title: t('markAttendance') }}
      />
      <Stack.Screen
        name="attendance/add"
        options={{ title: t('addAttendance') }}
      />
      <Stack.Screen
        name="payment/add"
        options={{ title: t('addPayment') }}
      />
    </Stack>
  );
}
