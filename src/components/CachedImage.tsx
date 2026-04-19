import React from "react";
import { Image, ImageProps } from "expo-image";

type CachedImageProps = Omit<ImageProps, "source"> & {
  uri?: string | null;
};

export function CachedImage({ uri, ...props }: CachedImageProps) {
  if (!uri) {
    return null;
  }

  return <Image {...props} source={{ uri }} cachePolicy="memory-disk" transition={120} />;
}
