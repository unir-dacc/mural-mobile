import React, { useEffect, useRef } from "react";
import { View, Animated, Easing, Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const SkeletonPulse: React.FC<{ style?: object; className?: string }> = ({
  style,
  className,
}) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return <Animated.View style={[{ opacity }, style]} className={className} />;
};

export const PostSkeleton: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const base = isDarkMode ? "bg-gray-700" : "bg-gray-200";
  return (
    <View>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 gap-3">
        <SkeletonPulse className={`w-10 h-10 rounded-full ${base}`} />
        <SkeletonPulse className={`h-3 w-32 rounded-full ${base}`} />
      </View>
      {/* Image */}
      <SkeletonPulse className={base} style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }} />
      {/* Actions */}
      <View className="flex-row items-center px-4 pt-4 pb-2 gap-4">
        <SkeletonPulse className={`w-7 h-7 rounded-full ${base}`} />
        <SkeletonPulse className={`w-7 h-7 rounded-full ${base}`} />
      </View>
      {/* Like count */}
      <SkeletonPulse className={`mx-4 h-3 w-20 rounded-full mb-3 ${base}`} />
      {/* Caption lines */}
      <SkeletonPulse className={`mx-4 h-3 w-3/4 rounded-full mb-2 ${base}`} />
      <SkeletonPulse className={`mx-4 h-3 w-1/2 rounded-full mb-4 ${base}`} />
      {/* Comment rows */}
      {[0, 1, 2].map((i) => (
        <View key={i} className="flex-row items-center px-4 gap-3 mb-3">
          <SkeletonPulse className={`w-8 h-8 rounded-full ${base}`} />
          <SkeletonPulse className={`h-3 rounded-full ${base}`} style={{ flex: 1 }} />
        </View>
      ))}
    </View>
  );
};
