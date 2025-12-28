import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, SegmentedButtons, IconButton } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { getLabourById, markAttendance, getAttendanceByLabour } from '../../../src/db/database';
import { theme, formatCurrency, getTodayDate, formatDate } from '../../../src/utils/theme';
import type { LabourWithStats, Attendance } from '../../../src/types';

export default function AddAttendanceScreen() {
  const { labourId } = useLocalSearchParams<{ labourId: string }>();
  const labId = parseInt(labourId || '0', 10);

  const [labour, setLabour] = useState<LabourWithStats | null>(null);
  const [date, setDate] = useState(getTodayDate());
  const [workType, setWorkType] = useState<'full' | 'half'>('full');
  const [existingAttendance, setExistingAttendance] = useState<Attendance | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [labId, date]);

  const loadData = async () => {
    const [labourData, attendanceData] = await Promise.all([
      getLabourById(labId),
      getAttendanceByLabour(labId),
    ]);
    setLabour(labourData);

    const existing = attendanceData.find((a) => a.date === date);
    setExistingAttendance(existing || null);
    if (existing) {
      setWorkType(existing.workType);
    }
  };

  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const handleSave = async () => {
    setIsLoading(true);
    await markAttendance(labId, date, workType);
    setIsLoading(false);
    router.back();
  };

  if (!labour) {
    return (
      <View style={styles.loading}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const amount = workType === 'full' ? labour.dailyWage : labour.dailyWage / 2;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Card style={styles.labourCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.labourName}>
              {labour.name}
            </Text>
            <Text variant="bodyMedium" style={styles.wage}>
              {formatCurrency(labour.dailyWage)} / day
            </Text>
          </Card.Content>
        </Card>

        <Text variant="labelLarge" style={styles.sectionLabel}>
          Date
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

        {existingAttendance && (
          <Card style={styles.existingCard}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.existingText}>
                Attendance already marked for this date as {existingAttendance.workType === 'full' ? 'Full Day' : 'Half Day'}.
                Saving will update it.
              </Text>
            </Card.Content>
          </Card>
        )}

        <Text variant="labelLarge" style={styles.sectionLabel}>
          Work Type
        </Text>
        <SegmentedButtons
          value={workType}
          onValueChange={(value) => setWorkType(value as 'full' | 'half')}
          buttons={[
            { value: 'full', label: 'Full Day', icon: 'weather-sunny' },
            { value: 'half', label: 'Half Day', icon: 'weather-partly-cloudy' },
          ]}
          style={styles.workTypeButtons}
        />

        <Card style={styles.summaryCard}>
          <Card.Content>
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium" style={styles.summaryLabel}>Amount to be earned:</Text>
              <Text variant="titleLarge" style={styles.summaryAmount}>
                {formatCurrency(amount)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.button}
          contentStyle={styles.buttonContent}
          loading={isLoading}
          disabled={isLoading}
        >
          {existingAttendance ? 'Update Attendance' : 'Mark Attendance'}
        </Button>
      </ScrollView>
    </View>
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
  labourCard: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  labourName: {
    fontWeight: '600',
  },
  wage: {
    color: theme.colors.primary,
    marginTop: 4,
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
  existingCard: {
    marginBottom: 24,
    backgroundColor: '#FFF3E0',
  },
  existingText: {
    color: '#E65100',
  },
  workTypeButtons: {
    marginBottom: 24,
  },
  summaryCard: {
    marginBottom: 24,
    backgroundColor: theme.colors.primaryContainer,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#666',
  },
  summaryAmount: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  button: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
