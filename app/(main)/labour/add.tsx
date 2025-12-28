import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { createLabour } from '../../../src/db/database';
import { theme } from '../../../src/utils/theme';
import { useI18n } from '../../../src/utils/i18n';

export default function AddLabourScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const projId = parseInt(projectId || '0', 10);
  const { t } = useI18n();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dailyWage, setDailyWage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) {
      setError(t('labourName'));
      return;
    }

    const wage = parseFloat(dailyWage) || 0;
    if (wage <= 0) {
      setError(t('dailyWage'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await createLabour(
        projId,
        name.trim(),
        phone.trim() || null,
        wage
      );
      router.back();
    } catch (e) {
      setError('Failed to add labour. Please try again.');
    }

    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="bodyMedium" style={styles.hint}>
          {t('addLabourHint')}
        </Text>

        <TextInput
          label={t('labourName')}
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError('');
          }}
          style={styles.input}
          error={!!error && !name.trim()}
        />

        <TextInput
          label={t('phone')}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={10}
          left={<TextInput.Affix text="+91" />}
          style={styles.input}
        />

        <TextInput
          label={t('dailyWage')}
          value={dailyWage}
          onChangeText={(text) => {
            setDailyWage(text.replace(/[^0-9.]/g, ''));
            setError('');
          }}
          keyboardType="numeric"
          left={<TextInput.Affix text="₹" />}
          style={styles.input}
          error={!!error && (!dailyWage || parseFloat(dailyWage) <= 0)}
        />

        {error ? (
          <Text variant="bodySmall" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <Button
          mode="contained"
          onPress={handleAdd}
          style={styles.button}
          contentStyle={styles.buttonContent}
          loading={isLoading}
          disabled={isLoading}
        >
          {t('addLabour')}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 20,
  },
  hint: {
    color: '#666',
    marginBottom: 24,
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
});
