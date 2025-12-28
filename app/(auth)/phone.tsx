import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { theme } from '../../src/utils/theme';

export default function PhoneScreen() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const setPendingPhone = useAuthStore((state) => state.setPendingPhone);

  const handleContinue = () => {
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setPendingPhone(cleanPhone);
    router.push('/(auth)/verify');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Surface style={styles.header} elevation={0}>
          <Text variant="displaySmall" style={styles.title}>
            Labour Thekedar
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Manage your labour attendance and payments
          </Text>
        </Surface>

        <Surface style={styles.form} elevation={1}>
          <Text variant="titleMedium" style={styles.formTitle}>
            Enter your phone number
          </Text>

          <TextInput
            label="Phone Number"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setError('');
            }}
            keyboardType="phone-pad"
            maxLength={10}
            left={<TextInput.Affix text="+91" />}
            style={styles.input}
            error={!!error}
          />

          {error ? (
            <Text variant="bodySmall" style={styles.error}>
              {error}
            </Text>
          ) : null}

          <Button
            mode="contained"
            onPress={handleContinue}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Continue
          </Button>

          <Text variant="bodySmall" style={styles.hint}>
            We'll send you an OTP to verify your number
          </Text>
        </Surface>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: 'transparent',
  },
  title: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  form: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  formTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  error: {
    color: theme.colors.error,
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  hint: {
    marginTop: 16,
    textAlign: 'center',
    color: '#666',
  },
});
