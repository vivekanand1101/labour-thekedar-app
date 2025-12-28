import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Checkbox, SegmentedButtons, IconButton } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { getLaboursByProject, markAttendance, getAttendanceByDate } from '../../../src/db/database';
import { theme, formatCurrency, getTodayDate, formatDate } from '../../../src/utils/theme';
import type { LabourWithStats, Attendance } from '../../../src/types';

interface AttendanceItem {
  labourId: number;
  selected: boolean;
  workType: 'full' | 'half';
}

export default function MarkAttendanceScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const projId = parseInt(projectId || '0', 10);

  const [date, setDate] = useState(getTodayDate());
  const [labours, setLabours] = useState<LabourWithStats[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<number, AttendanceItem>>({});
  const [existingAttendance, setExistingAttendance] = useState<Record<number, Attendance>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const loadData = async () => {
    const [laboursData, existingData] = await Promise.all([
      getLaboursByProject(projId),
      getAttendanceByDate(projId, date),
    ]);

    setLabours(laboursData);

    const existing: Record<number, Attendance> = {};
    existingData.forEach((a) => {
      existing[a.labourId] = a;
    });
    setExistingAttendance(existing);

    const initial: Record<number, AttendanceItem> = {};
    laboursData.forEach((l) => {
      const existingRecord = existing[l.id];
      initial[l.id] = {
        labourId: l.id,
        selected: !!existingRecord,
        workType: existingRecord?.workType || 'full',
      };
    });
    setAttendanceMap(initial);
    setHasChanges(false);
  };

  useEffect(() => {
    loadData();
  }, [projId, date]);

  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const toggleLabour = (labourId: number) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [labourId]: {
        ...prev[labourId],
        selected: !prev[labourId].selected,
      },
    }));
    setHasChanges(true);
  };

  const setWorkType = (labourId: number, workType: 'full' | 'half') => {
    setAttendanceMap((prev) => ({
      ...prev,
      [labourId]: {
        ...prev[labourId],
        workType,
        selected: true,
      },
    }));
    setHasChanges(true);
  };

  const selectAll = () => {
    setAttendanceMap((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        updated[parseInt(key)] = { ...updated[parseInt(key)], selected: true };
      });
      return updated;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsLoading(true);

    const promises = Object.values(attendanceMap).map((item) => {
      if (item.selected) {
        return markAttendance(item.labourId, date, item.workType);
      }
      return Promise.resolve();
    });

    await Promise.all(promises);
    setIsLoading(false);
    router.back();
  };

  const selectedCount = Object.values(attendanceMap).filter((a) => a.selected).length;

  return (
    <View style={styles.container}>
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

      <View style={styles.header}>
        <Text variant="bodyMedium" style={styles.hint}>
          Select labourers who worked on this date
        </Text>
        <Button mode="text" onPress={selectAll} compact>
          Select All
        </Button>
      </View>

      <ScrollView style={styles.list}>
        {labours.length === 0 ? (
          <Text style={styles.emptyText}>
            No labourers in this project yet
          </Text>
        ) : (
          labours.map((labour) => {
            const item = attendanceMap[labour.id];
            if (!item) return null;

            return (
              <Card key={labour.id} style={styles.card}>
                <Card.Content style={styles.cardContent}>
                  <Checkbox
                    status={item.selected ? 'checked' : 'unchecked'}
                    onPress={() => toggleLabour(labour.id)}
                  />
                  <View style={styles.labourInfo}>
                    <Text variant="titleMedium">{labour.name}</Text>
                    <Text variant="bodySmall" style={styles.wage}>
                      {formatCurrency(labour.dailyWage)}/day
                    </Text>
                  </View>
                  {item.selected && (
                    <SegmentedButtons
                      value={item.workType}
                      onValueChange={(value) => setWorkType(labour.id, value as 'full' | 'half')}
                      buttons={[
                        { value: 'full', label: 'Full' },
                        { value: 'half', label: 'Half' },
                      ]}
                      style={styles.workTypeButtons}
                      density="small"
                    />
                  )}
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Text variant="bodyMedium" style={styles.selectedCount}>
          {selectedCount} of {labours.length} selected
        </Text>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={isLoading}
          disabled={isLoading || !hasChanges}
          style={styles.saveButton}
        >
          Save Attendance
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dateText: {
    minWidth: 120,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  hint: {
    color: '#666',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 40,
  },
  card: {
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labourInfo: {
    flex: 1,
    marginLeft: 8,
  },
  wage: {
    color: '#666',
  },
  workTypeButtons: {
    width: 140,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  selectedCount: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 12,
  },
  saveButton: {
    borderRadius: 8,
  },
});
