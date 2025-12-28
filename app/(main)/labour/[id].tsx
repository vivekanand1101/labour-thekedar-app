import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, Divider, Portal, Dialog, TextInput, IconButton, SegmentedButtons } from 'react-native-paper';
import { router, useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';
import {
  getLabourById,
  getAttendanceByLabour,
  getPaymentsByLabour,
  updateLabour,
  deleteLabour,
  removeAttendance,
  deletePayment,
} from '../../../src/db/database';
import { theme, formatCurrency, formatDate } from '../../../src/utils/theme';
import type { LabourWithStats, Attendance, Payment } from '../../../src/types';

export default function LabourDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const labourId = parseInt(id || '0', 10);

  const [labour, setLabour] = useState<LabourWithStats | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('attendance');

  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWage, setEditWage] = useState('');

  const loadData = async () => {
    const [labourData, attendanceData, paymentsData] = await Promise.all([
      getLabourById(labourId),
      getAttendanceByLabour(labourId),
      getPaymentsByLabour(labourId),
    ]);
    setLabour(labourData);
    setAttendance(attendanceData);
    setPayments(paymentsData);

    if (labourData) {
      setEditName(labourData.name);
      setEditPhone(labourData.phone || '');
      setEditWage(labourData.dailyWage.toString());
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [labourId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleEdit = async () => {
    if (!editName.trim() || !editWage) return;
    await updateLabour(labourId, editName.trim(), editPhone.trim() || null, parseFloat(editWage));
    setEditDialogVisible(false);
    loadData();
  };

  const handleDelete = async () => {
    await deleteLabour(labourId);
    setDeleteDialogVisible(false);
    router.back();
  };

  const handleRemoveAttendance = async (date: string) => {
    await removeAttendance(labourId, date);
    loadData();
  };

  const handleDeletePayment = async (paymentId: number) => {
    await deletePayment(paymentId);
    loadData();
  };

  if (!labour) {
    return (
      <View style={styles.loading}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: labour.name }} />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoHeader}>
              <View style={styles.infoMain}>
                <Text variant="headlineSmall" style={styles.name}>
                  {labour.name}
                </Text>
                {labour.phone && (
                  <Text variant="bodyMedium" style={styles.phone}>
                    +91 {labour.phone}
                  </Text>
                )}
                <Text variant="bodyMedium" style={styles.wage}>
                  {formatCurrency(labour.dailyWage)} / day
                </Text>
              </View>
              <View style={styles.actions}>
                <IconButton icon="pencil" onPress={() => setEditDialogVisible(true)} />
                <IconButton
                  icon="delete"
                  iconColor={theme.colors.error}
                  onPress={() => setDeleteDialogVisible(true)}
                />
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Text variant="labelSmall" style={styles.statLabel}>Days Worked</Text>
                <Text variant="titleLarge" style={styles.statValue}>{labour.attendanceCount}</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="labelSmall" style={styles.statLabel}>Total Earned</Text>
                <Text variant="titleLarge" style={styles.statValue}>{formatCurrency(labour.totalEarned)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="labelSmall" style={styles.statLabel}>Total Paid</Text>
                <Text variant="titleLarge" style={styles.statValue}>{formatCurrency(labour.totalPaid)}</Text>
              </View>
            </View>

            <View style={styles.balanceContainer}>
              <Text variant="labelMedium" style={styles.balanceLabel}>
                {labour.balance > 0 ? 'Balance Due' : 'Balance'}
              </Text>
              <Chip
                mode="flat"
                style={[
                  styles.balanceChip,
                  labour.balance > 0 ? styles.pendingChip : styles.clearedChip,
                ]}
                textStyle={[
                  styles.balanceText,
                  labour.balance > 0 ? styles.pendingText : styles.clearedText,
                ]}
              >
                {formatCurrency(Math.abs(labour.balance))}
                {labour.balance < 0 ? ' (Overpaid)' : ''}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          icon="cash-plus"
          onPress={() => router.push(`/(main)/payment/add?labourId=${labourId}`)}
          style={styles.payButton}
        >
          Add Payment
        </Button>

        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'attendance', label: `Attendance (${attendance.length})` },
            { value: 'payments', label: `Payments (${payments.length})` },
          ]}
          style={styles.tabs}
        />

        {activeTab === 'attendance' && (
          <View style={styles.section}>
            {attendance.length === 0 ? (
              <Text style={styles.emptyText}>No attendance records yet</Text>
            ) : (
              attendance.map((item) => (
                <Card key={item.id} style={styles.recordCard}>
                  <Card.Content style={styles.recordContent}>
                    <View style={styles.recordInfo}>
                      <Text variant="titleMedium">{formatDate(item.date)}</Text>
                      <Chip
                        mode="flat"
                        compact
                        style={item.workType === 'full' ? styles.fullChip : styles.halfChip}
                      >
                        {item.workType === 'full' ? 'Full Day' : 'Half Day'}
                      </Chip>
                    </View>
                    <Text variant="bodyMedium" style={styles.amount}>
                      {formatCurrency(item.workType === 'full' ? labour.dailyWage : labour.dailyWage / 2)}
                    </Text>
                    <IconButton
                      icon="close"
                      size={18}
                      onPress={() => handleRemoveAttendance(item.date)}
                    />
                  </Card.Content>
                </Card>
              ))
            )}
          </View>
        )}

        {activeTab === 'payments' && (
          <View style={styles.section}>
            {payments.length === 0 ? (
              <Text style={styles.emptyText}>No payments yet</Text>
            ) : (
              payments.map((item) => (
                <Card key={item.id} style={styles.recordCard}>
                  <Card.Content style={styles.recordContent}>
                    <View style={styles.recordInfo}>
                      <Text variant="titleMedium">{formatDate(item.date)}</Text>
                      <Chip
                        mode="flat"
                        compact
                        style={item.type === 'advance' ? styles.advanceChip : styles.settlementChip}
                      >
                        {item.type === 'advance' ? 'Advance' : 'Settlement'}
                      </Chip>
                    </View>
                    <Text variant="titleMedium" style={styles.paymentAmount}>
                      {formatCurrency(item.amount)}
                    </Text>
                    <IconButton
                      icon="close"
                      size={18}
                      onPress={() => handleDeletePayment(item.id)}
                    />
                  </Card.Content>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)}>
          <Dialog.Title>Edit Labour</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name"
              value={editName}
              onChangeText={setEditName}
              style={styles.dialogInput}
            />
            <TextInput
              label="Phone"
              value={editPhone}
              onChangeText={setEditPhone}
              keyboardType="phone-pad"
              style={styles.dialogInput}
            />
            <TextInput
              label="Daily Wage"
              value={editWage}
              onChangeText={setEditWage}
              keyboardType="numeric"
              left={<TextInput.Affix text="₹" />}
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleEdit}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Labour</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete {labour.name}? This will also delete all their attendance and payment records.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleDelete} textColor={theme.colors.error}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  infoCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoMain: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
  },
  name: {
    fontWeight: '600',
  },
  phone: {
    color: '#666',
    marginTop: 4,
  },
  wage: {
    color: theme.colors.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '600',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  balanceLabel: {
    color: '#666',
  },
  balanceChip: {
    paddingHorizontal: 8,
  },
  balanceText: {
    fontWeight: '600',
    fontSize: 16,
  },
  pendingChip: {
    backgroundColor: '#FFEBEE',
  },
  clearedChip: {
    backgroundColor: '#E8F5E9',
  },
  pendingText: {
    color: theme.colors.error,
  },
  clearedText: {
    color: theme.colors.tertiary,
  },
  payButton: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tabs: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 24,
  },
  recordCard: {
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  recordContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amount: {
    color: '#666',
    marginRight: 8,
  },
  paymentAmount: {
    color: theme.colors.tertiary,
    fontWeight: '600',
    marginRight: 8,
  },
  fullChip: {
    backgroundColor: '#E3F2FD',
  },
  halfChip: {
    backgroundColor: '#FFF3E0',
  },
  advanceChip: {
    backgroundColor: '#FFF3E0',
  },
  settlementChip: {
    backgroundColor: '#E8F5E9',
  },
  dialogInput: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
});
