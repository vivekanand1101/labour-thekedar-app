import { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { FAB, Card, Text, IconButton, Menu, Divider } from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { getProjectsByUser } from '../../src/db/database';
import { theme, formatCurrency } from '../../src/utils/theme';
import { useI18n } from '../../src/utils/i18n';
import type { ProjectWithStats } from '../../src/types';

export default function ProjectsScreen() {
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const { t } = useI18n();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const loadProjects = async () => {
    if (!user) return;
    const data = await getProjectsByUser(user.id);
    setProjects(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };

  const handleLogout = () => {
    setMenuVisible(false);
    logout();
    router.replace('/(auth)/phone');
  };

  const renderProject = ({ item }: { item: ProjectWithStats }) => (
    <Card
      style={styles.card}
      onPress={() => router.push(`/(main)/project/${item.id}`)}
    >
      <Card.Content>
        <Text variant="titleMedium" style={styles.projectName}>
          {item.name}
        </Text>
        {item.description ? (
          <Text variant="bodySmall" style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text variant="labelSmall" style={styles.statLabel}>{t('labourers')}</Text>
            <Text variant="titleMedium" style={styles.statValue}>{item.labourCount}</Text>
          </View>
          <View style={styles.stat}>
            <Text variant="labelSmall" style={styles.statLabel}>{t('pendingDues')}</Text>
            <Text
              variant="titleMedium"
              style={[
                styles.statValue,
                item.totalPendingDues > 0 ? styles.pendingDues : styles.cleared,
              ]}
            >
              {formatCurrency(item.totalPendingDues)}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        {t('noProjectsYet')}
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubtitle}>
        {t('createFirstProject')}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="bodyMedium" style={styles.welcome}>
          {t('welcome')}, {user?.name}
        </Text>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item onPress={handleLogout} title={t('logout')} leadingIcon="logout" />
        </Menu>
      </View>

      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/(main)/project/create')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  welcome: {
    color: '#666',
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  projectName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    color: '#666',
    marginBottom: 12,
  },
  stats: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '600',
  },
  pendingDues: {
    color: theme.colors.error,
  },
  cleared: {
    color: theme.colors.tertiary,
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
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});
