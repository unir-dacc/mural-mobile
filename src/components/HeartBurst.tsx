import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, Easing, View } from "react-native";
import { Heart } from "lucide-react-native";

const { height: SCREEN_H } = Dimensions.get("window");

const COLORS = ["#ef4444", "#f43f5e", "#ec4899", "#f97316", "#fb7185", "#e11d48"];
const COUNT = 16;

interface ParticleProps {
  delay: number;
  driftX: number;
  color: string;
  size: number;
  duration: number;
}

function HeartParticle({ delay, driftX, color, size, duration }: ParticleProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.timing(progress, {
        toValue: 1,
        duration,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, []);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(SCREEN_H * 0.78)],
  });

  // Sinusoidal-ish horizontal drift via two keyframes
  const translateX = progress.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, driftX * 0.5, driftX],
  });

  const opacity = progress.interpolate({
    inputRange: [0, 0.06, 0.65, 1],
    outputRange: [0, 1, 1, 0],
  });

  const scale = progress.interpolate({
    inputRange: [0, 0.08, 0.18, 1],
    outputRange: [0, 1.5, 1, 0.7],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: 90,
        alignSelf: "center",
        opacity,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    >
      <Heart size={size} color={color} fill={color} />
    </Animated.View>
  );
}

export function HeartBurst() {
  const particles = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        id: i,
        delay: i * 55 + Math.random() * 35,
        driftX: (Math.random() - 0.5) * 220,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 16 + Math.random() * 32,
        duration: 1000 + Math.random() * 600,
      })),
    []
  );

  return (
    <View pointerEvents="none" style={{ position: "absolute", inset: 0, zIndex: 999 }}>
      {particles.map((p) => (
        <HeartParticle key={p.id} {...p} />
      ))}
    </View>
  );
}
