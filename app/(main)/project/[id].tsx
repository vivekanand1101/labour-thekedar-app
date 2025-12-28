import { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { FAB, Card, Text, Chip, IconButton, Portal, Dialog, Button } from 'react-native-paper';
import { router, useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';
import { getProjectById, getLaboursByProject, deleteProject } from '../../../src/db/database';
import { theme, formatCurrency } from '../../../src/utils/theme';
import { useI18n } from '../../../src/utils/i18n';
import type { Project, LabourWithStats } from '../../../src/types';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = parseInt(id || '0', 10);
  const { t } = useI18n();

  const [project, setProject] = useState<Project | null>(null);
  const [labours, setLabours] = useState<LabourWithStats[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  const loadData = async () => {
    const [projectData, laboursData] = await Promise.all([
      getProjectById(projectId),
      getLaboursByProject(projectId),
    ]);
    setProject(projectData);
    setLabours(laboursData);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [projectId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDelete = async () => {
    await deleteProject(projectId);
    setDeleteDialogVisible(false);
    router.back();
  };

  const renderLabour = ({ item }: { item: LabourWithStats }) => (
    <Card
      style={styles.card}
      onPress={() => router.push(`/(main)/labour/${item.id}`)}
    >
      <Card.Content>
        <View style={styles.labourHeader}>
          <View style={styles.labourInfo}>
            <Text variant="titleMedium" style={styles.labourName}>
              {item.name}
            </Text>
            <Text variant="bodySmall" style={styles.wage}>
              {formatCurrency(item.dailyWage)}/day
            </Text>
          </View>
          <Chip
            mode="flat"
            style={[
              styles.balanceChip,
              item.balance > 0 ? styles.pendingChip : styles.clearedChip,
            ]}
            textStyle={item.balance > 0 ? styles.pendingText : styles.clearedText}
          >
            {item.balance > 0 ? `${t('balanceDue')}: ${formatCurrency(item.balance)}` : t('cleared')}
          </Chip>
        </View>
        <View style={styles.labourStats}>
          <Text variant="bodySmall" style={styles.statText}>
            {item.attendanceCount} {t('daysWorked')}
          </Text>
          <Text variant="bodySmall" style={styles.statText}>
            {t('totalEarned')}: {formatCurrency(item.totalEarned)}
          </Text>
          <Text variant="bodySmall" style={styles.statText}>
            {t('totalPaid')}: {formatCurrency(item.totalPaid)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        {t('noLabourersYet')}
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubtitle}>
        {t('addLabourersHint')}
      </Text>
    </View>
  );

  const totalPending = labours.reduce((sum, l) => sum + Math.max(0, l.balance), 0);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: project?.name || 'Project' }} />

      {project && (
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text variant="labelSmall" style={styles.summaryLabel}>{t('labourers')}</Text>
            <Text variant="headlineSmall" style={styles.summaryValue}>{labours.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text variant="labelSmall" style={styles.summaryLabel}>{t('pendingDues')}</Text>
            <Text
              variant="headlineSmall"
              style={[styles.summaryValue, totalPending > 0 ? styles.pending : styles.cleared]}
            >
              {formatCurrency(totalPending)}
            </Text>
          </View>
          <IconButton
            icon="delete"
            iconColor={theme.colors.error}
            onPress={() => setDeleteDialogVisible(true)}
          />
        </View>
      )}

      <FlatList
        data={labours}
        renderItem={renderLabour}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <FAB.Group
        open={fabOpen}
        visible
        icon={fabOpen ? 'close' : 'plus'}
        actions={[
          {
            icon: 'account-plus',
            label: t('addLabour'),
            onPress: () => router.push(`/(main)/labour/add?projectId=${projectId}`),
          },
          {
            icon: 'calendar-check',
            label: t('markAttendance'),
            onPress: () => router.push(`/(main)/attendance/mark?projectId=${projectId}`),
          },
        ]}
        onStateChange={({ open }) => setFabOpen(open)}
        fabStyle={styles.fab}
      />

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>{t('deleteProject')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {t('deleteProjectConfirm')}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>{t('cancel')}</Button>
            <Button onPress={handleDelete} textColor={theme.colors.error}>{t('delete')}</Button>
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
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    color: '#999',
    marginBottom: 4,
  },
  summaryValue: {
    fontWeight: '600',
  },
  pending: {
    color: theme.colors.error,
  },
  cleared: {
    color: theme.colors.tertiary,
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  labourHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  labourInfo: {
    flex: 1,
  },
  labourName: {
    fontWeight: '600',
  },
  wage: {
    color: '#666',
    marginTop: 2,
  },
  balanceChip: {
    marginLeft: 8,
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
  labourStats: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 16,
  },
  statText: {
    color: '#666',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    backgroundColor: theme.colors.primary,
  },
});
