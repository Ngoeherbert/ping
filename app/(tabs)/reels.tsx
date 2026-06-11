import { useEffect, useRef } from 'react';
import { Dimensions, FlatList, StatusBar, StyleSheet, View, type ViewToken } from 'react-native';
import { ReelItem } from '@/components/reels/ReelItem';
import { useReelStore } from '@/store/reelStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ReelsScreen() {
  const { reels, fetchReels, loadMore, setActiveIndex, activeIndex } = useReelStore();
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70 });
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]) {
        setActiveIndex(viewableItems[0].index ?? 0);
      }
    },
  );

  useEffect(() => {
    fetchReels();
  }, [fetchReels]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={reels}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        decelerationRate="fast"
        renderItem={({ item, index }) => <ReelItem reel={item} isActive={index === activeIndex} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        viewabilityConfig={viewabilityConfig.current}
        onViewableItemsChanged={onViewableItemsChanged.current}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
});
