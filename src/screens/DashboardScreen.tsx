import { StyleSheet, View } from 'react-native';

import { ConnectionStatus } from '../components/ConnectionStatus';
import { LampControl } from '../components/LampControl';
import { Screen } from '../components/Screen';
import { SectionTitle } from '../components/SectionTitle';
import { SensorCard } from '../components/SensorCard';
import { useMqtt } from '../contexts/MqttContext';
import { useTheme } from '../contexts/ThemeContext';

export function DashboardScreen() {
  const { colors } = useTheme();
  const { connection, temperature, humidity, lamp, pendingCommand, sendLampCommand } = useMqtt();

  return (
    <Screen>
      <ConnectionStatus />

      <SectionTitle>Sensores</SectionTitle>
      <View style={styles.sensors}>
        <SensorCard title="Temperatura" unit="°C" icon="thermometer" accentColor={colors.danger} reading={temperature} />
        <SensorCard title="Umidade" unit="%" icon="water" accentColor={colors.info} reading={humidity} fractionDigits={0} />
      </View>

      <SectionTitle>Controle</SectionTitle>
      <LampControl
        lamp={lamp}
        pendingCommand={pendingCommand}
        connected={connection.status === 'connected'}
        onCommand={sendLampCommand}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sensors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
