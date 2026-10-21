import { Ionicons } from '@expo/vector-icons';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { MessageItem } from '../components/MessageItem';
import { Screen } from '../components/Screen';
import { HISTORY_LIMIT } from '../config/mqttConfig';
import { useMqtt } from '../contexts/MqttContext';
import { useTheme } from '../contexts/ThemeContext';

export function HistoryScreen() {
  const { colors } = useTheme();
  const { history, clearHistory } = useMqtt();

  return (
    <Screen scroll={false}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageItem message={item} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]}>Últimas mensagens</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {history.length} de {HISTORY_LIMIT} · mais recentes primeiro
              </Text>
            </View>
            {history.length > 0 ? (
              <AppButton label="Limpar" icon="trash-outline" variant="ghost" onPress={clearHistory} />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhuma mensagem ainda</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Conecte-se ao broker e inicie o simulador. Mensagens enviadas e recebidas aparecem aqui em tempo real.
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 96,
    gap: 10,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
