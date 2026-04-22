import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface ZoomableViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Called on the JS thread when scale changes. Use to disable surrounding scroll. */
  onScaleChange?: (scale: number) => void;
}

const MAX_SCALE = 5;

export function ZoomableView({ children, style, onScaleChange }: ZoomableViewProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const notify = (s: number) => onScaleChange?.(s);

  const reset = () => {
    "worklet";
    scale.value = withSpring(1, { damping: 15 });
    translateX.value = withSpring(0, { damping: 15 });
    translateY.value = withSpring(0, { damping: 15 });
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    if (onScaleChange) runOnJS(notify)(1);
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(MAX_SCALE, Math.max(1, savedScale.value * e.scale));
      if (onScaleChange) runOnJS(notify)(scale.value);
    })
    .onEnd(() => {
      if (scale.value <= 1) {
        reset();
      } else {
        savedScale.value = scale.value;
      }
    });

  const pan = Gesture.Pan()
    .minPointers(2)
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      reset();
    });

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[style, animStyle]}>{children}</Animated.View>
    </GestureDetector>
  );
}
