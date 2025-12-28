import { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Card, IconButton } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { getLabourById, addPayment } from '../../../src/db/database';
import { theme, formatCurrency, getTodayDate, formatDate } from '../../../src/utils/theme';
import { useI18n } from '../../../src/utils/i18n';
import type { LabourWithStats } from '../../../src/types';

export default function AddPaymentScreen() {
  const { labourId } = useLocalSearchParams<{ labourId: string }>();
  const labId = parseInt(labourId || '0', 10);
  const { t } = useI18n();

  const [labour, setLabour] = useState<LabourWithStats | null>(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadLabour();
  }, [labId]);

  const loadLabour = async () => {
    const data = await getLabourById(labId);
    setLabour(data);
  };

  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const handleAdd = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError(t('validAmount'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await addPayment(labId, amountNum, date, 'payment', notes.trim() || undefined);
      router.back();
    } catch (e) {
      setError(t('paymentFailed'));
    }

    setIsLoading(false);
  };

  if (!labour) {
    return (
      <View style={styles.loading}>
        <Text>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.labourName}>
              {labour.name}
            </Text>
            <View style={styles.balanceRow}>
              <Text variant="bodyMedium" style={styles.balanceLabel}>
                {t('currentBalance')}:
              </Text>
              <Text
                variant="titleMedium"
                style={[
                  styles.balance,
                  labour.balance > 0 ? styles.pending : styles.cleared,
                ]}
              >
                {formatCurrency(labour.balance)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Text variant="labelLarge" style={styles.sectionLabel}>
          {t('date')}
        </Text>
        <View style={styles.dateSelector}>
          <IconButton icon="chevron-left" onPress={() => changeDate(-1)} />
          <Text variant="titleMedium" style={styles.dateText}>
            {formatDate(date)}
          </Text>
          <IconButton
            icon="chevron-right"
            onPress={() => changeDate(1)}
            disabled={date >= getTodayDate()}
          />
        </View>

        <Text variant="labelLarge" style={styles.sectionLabel}>
          {t('amount')}
        </Text>
        <TextInput
          value={amount}
          onChangeText={(text) => {
            setAmount(text.replace(/[^0-9]/g, ''));
            setError('');
          }}
          keyboardType="numeric"
          placeholder={t('amountPlaceholder')}
          left={<TextInput.Affix text="₹" />}
          style={styles.input}
          error={!!error}
        />

        <TextInput
          label={t('notes')}
          value={notes}
          onChangeText={setNotes}
          style={styles.input}
          multiline
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
          {t('addPayment')}
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  infoCard: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  labourName: {
    fontWeight: '600',
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    color: '#666',
  },
  balance: {
    fontWeight: '600',
  },
  pending: {
    color: theme.colors.error,
  },
  cleared: {
    color: theme.colors.tertiary,
  },
  sectionLabel: {
    marginBottom: 8,
    color: '#666',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 4,
  },
  dateText: {
    minWidth: 120,
    textAlign: 'center',
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
