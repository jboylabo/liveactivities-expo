import { Gauge, HStack, Image, Text, VStack } from '@expo/ui/swift-ui';
import { gaugeStyle, tint } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

export type FlightActivityProps = {
  departureLabel: string;
  flightLabel: string;
  progress: number;
  remainingLabel: string;
  statusMessage: string;
};

function FlightActivity(props: FlightActivityProps, environment: LiveActivityEnvironment) {
  'widget';

  const { departureLabel, flightLabel, progress, remainingLabel, statusMessage } = props;
  const accentColor = environment.colorScheme === 'dark' ? '#5AC8FA' : '#007AFF';
  const percentLabel = `${Math.round(progress * 100)}%`;

  const gauge = (
    <Gauge
      value={progress}
      min={0}
      max={1}
      modifiers={[gaugeStyle('circular'), tint(accentColor)]}
      currentValueLabel={<Text>{percentLabel}</Text>}
      minimumValueLabel={<Text>{departureLabel}</Text>}
      maximumValueLabel={<Text>{flightLabel}</Text>}>
      <Text>Flight Countdown</Text>
    </Gauge>
  );

  return {
    banner: (
      <HStack spacing={12}>
        {gauge}
        <VStack spacing={4}>
          <Text>{statusMessage}</Text>
          <Text>{remainingLabel}</Text>
        </VStack>
      </HStack>
    ),
    compactLeading: <Image systemName="airplane.departure" color={accentColor} />,
    compactTrailing: <Text>{percentLabel}</Text>,
    minimal: <Image systemName="airplane.departure" color={accentColor} />,
    expandedLeading: (
      <VStack>
        <Image systemName="airplane.departure" color={accentColor} />
      </VStack>
    ),
    expandedTrailing: (
      <VStack>
        <Text>{remainingLabel}</Text>
      </VStack>
    ),
    expandedBottom: (
      <VStack spacing={8}>
        <Text>{statusMessage}</Text>
        {gauge}
      </VStack>
    ),
  };
}

export default createLiveActivity('FlightActivity', FlightActivity);
