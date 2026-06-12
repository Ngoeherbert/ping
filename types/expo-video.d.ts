declare module 'expo-video' {
  import type { ComponentType } from 'react';
  import type { ViewStyle } from 'react-native';

  export type VideoPlayer = {
    loop: boolean;
    muted: boolean;
    play: () => void;
    pause: () => void;
  };

  export function useVideoPlayer(
    source: string | null,
    setup?: (player: VideoPlayer) => void,
  ): VideoPlayer;

  export const VideoView: ComponentType<{
    player: VideoPlayer;
    style?: ViewStyle;
    contentFit?: 'contain' | 'cover' | 'fill';
    nativeControls?: boolean;
  }>;
}
