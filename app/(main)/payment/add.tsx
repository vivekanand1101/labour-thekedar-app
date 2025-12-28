import { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons, Card } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { getLabourById, addPayment } from '../../../src/db/database';
import { theme, formatCurrency, getTodayDate } from '../../../src/utils/theme';
import type { LabourWithStats } from '../../../src/types';

export default function AddPaymentScreen() {
  const { labourId } = useLocalSearchParams<{ labourId: string }>();
  const labId = parseInt(labourId || '0', 10);

  const [labour, setLabour] = useState<LabourWithStats | null>(null);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'advance' | 'settlement'>('settlement');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadLabour();
  }, [labId]);

  const loadLabour = async () => {
    const data = await getLabourById(labId);
    setLabour(data);
    if (data && data.balance > 0) {
      setAmount(data.balance.toString());
    }
  };

  const handleAdd = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await addPayment(labId, amountNum, getTodayDate(), type, notes.trim() || undefined);
      router.back();
    } catch (e) {
      setError('Failed to add payment. Please try again.');
    }

    setIsLoading(false);
  };

  const setFullBalance = () => {
    if (labour && labour.balance > 0) {
      setAmount(labour.balance.toString());
    }
  };

  if (!labour) {
    return (
      <View style={styles.loading}>
        <Text>Loading...</Text>
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
                Current Balance:
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
          Payment Type
        </Text>
        <SegmentedButtons
          value={type}
          onValueChange={(value) => setType(value as 'advance' | 'settlement')}
          buttons={[
            { value: 'advance', label: 'Advance', icon: 'cash-fast' },
            { value: 'settlement', label: 'Settlement', icon: 'cash-check' },
          ]}
          style={styles.typeButtons}
        />

        <Text variant="labelLarge" style={styles.sectionLabel}>
          Amount
        </Text>
        <View style={styles.amountRow}>
          <TextInput
            value={amount}
            onChangeText={(text) => {
              setAmount(text.replace(/[^0-9.]/g, ''));
              setError('');
            }}
            keyboardType="numeric"
            left={<TextInput.Affix text="₹" />}
            style={styles.amountInput}
            error={!!error}
          />
          {labour.balance > 0 && (
            <Button mode="outlined" onPress={setFullBalance} style={styles.fullButton}>
              Full ({formatCurrency(labour.balance)})
            </Button>
          )}
        </View>

        <TextInput
          label="Notes (optional)"
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
          Add Payment
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
  typeButtons: {
    marginBottom: 24,
  },
  amountRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  amountInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  fullButton: {
    justifyContent: 'center',
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
