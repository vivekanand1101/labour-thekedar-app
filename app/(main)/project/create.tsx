import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '../../../src/store/authStore';
import { createProject } from '../../../src/db/database';
import { theme } from '../../../src/utils/theme';
import { useI18n } from '../../../src/utils/i18n';

export default function CreateProjectScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useI18n();

  const user = useAuthStore((state) => state.user);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError(t('projectName'));
      return;
    }

    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      await createProject(user.id, name.trim(), description.trim());
      router.back();
    } catch (e) {
      setError('Failed to create project. Please try again.');
    }

    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text variant="bodyMedium" style={styles.hint}>
          {t('createProjectHint')}
        </Text>

        <TextInput
          label={t('projectName')}
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError('');
          }}
          style={styles.input}
          error={!!error}
        />

        <TextInput
          label={t('description')}
          value={description}
          onChangeText={setDescription}
          style={styles.input}
          multiline
          numberOfLines={3}
        />

        {error ? (
          <Text variant="bodySmall" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <Button
          mode="contained"
          onPress={handleCreate}
          style={styles.button}
          contentStyle={styles.buttonContent}
          loading={isLoading}
          disabled={isLoading}
        >
          {t('createProject')}
        </Button>
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
