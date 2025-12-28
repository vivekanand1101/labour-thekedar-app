import { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { router, Redirect } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { theme } from '../../src/utils/theme';
import { getUserByPhone } from '../../src/db/database';

export default function VerifyScreen() {
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const pendingPhone = useAuthStore((state) => state.pendingPhone);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);

  useEffect(() => {
    const checkUserExists = async () => {
      if (!pendingPhone) return;
      const user = await getUserByPhone(pendingPhone);
      setIsNewUser(!user);
      if (user) {
        setName(user.name);
      }
    };
    checkUserExists();
  }, [pendingPhone]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    if (isNewUser && !name.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError('');

    const success = await verifyOtp(otp, isNewUser ? name.trim() : undefined);

    if (success) {
      router.replace('/(main)');
    } else {
      setError('Invalid OTP. Please try again.');
    }

    setIsLoading(false);
  };

  if (!pendingPhone) {
    return <Redirect href="/(auth)/phone" />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Surface style={styles.form} elevation={1}>
          <Text variant="titleMedium" style={styles.formTitle}>
            Verify your phone
          </Text>

          <Text variant="bodyMedium" style={styles.phoneText}>
            OTP sent to +91 {pendingPhone}
          </Text>

          <TextInput
            label="Enter OTP"
            value={otp}
            onChangeText={(text) => {
              setOtp(text.replace(/\D/g, ''));
              setError('');
            }}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.input}
            error={!!error && otp.length < 6}
          />

          {isNewUser && (
            <TextInput
              label="Your Name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setError('');
              }}
              style={styles.input}
              error={!!error && !name.trim()}
            />
          )}

          {error ? (
            <Text variant="bodySmall" style={styles.error}>
              {error}
            </Text>
          ) : null}

          <Button
            mode="contained"
            onPress={handleVerify}
            style={styles.button}
            contentStyle={styles.buttonContent}
            loading={isLoading}
            disabled={isLoading}
          >
            Verify & Continue
          </Button>

          <Text variant="bodySmall" style={styles.hint}>
            For demo, enter any 6-digit code
          </Text>
        </Surface>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  form: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  formTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  phoneText: {
    marginBottom: 24,
    textAlign: 'center',
    color: '#666',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  error: {
    color: theme.colors.error,
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  hint: {
    marginTop: 16,
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
});
