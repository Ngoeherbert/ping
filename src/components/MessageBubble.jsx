import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import Bubble from './chat/Bubble';
import TextMessage from './chat/TextMessage';
import VoiceMessage from './chat/VoiceMessage';
import ImageMessage from './chat/ImageMessage';
import VideoMessage from './chat/VideoMessage';
import ViewOnceMessage from './chat/ViewOnceMessage';
import FileMessage from './chat/FileMessage';
import GameBubble from './GameBubble';
import { haptic } from '../utils/haptics';

const STATUS_LABEL = { sent: 'Sent', delivered: 'Delivered', read: 'Read' };

export default function MessageBubble({
  message,
  showTail = true,
  showStatus = false,
  onLongPress,
}) {
  const { own, type } = message;

  const open = () => {
    if (type === 'game') {
      router.push({
        pathname: '/(modals)/game/[gameType]/[sessionId]',
        params: { gameType: message.game.type, sessionId: message.game.sessionId },
      });
    } else if (type === 'voice' || type === 'text') {
      return;
    } else if (type === 'viewOnce' && message.opened) {
      return;
    } else {
      router.push({ pathname: '/(modals)/media-viewer', params: { id: message.id } });
    }
  };

  let content;
  let framed = true; // wrapped in the colored bubble?

  switch (type) {
    case 'text':
      content = <TextMessage message={message} />;
      break;
    case 'voice':
      content = <VoiceMessage message={message} />;
      break;
    case 'viewOnce':
      content = <ViewOnceMessage message={message} />;
      break;
    case 'file':
      content = <FileMessage message={message} />;
      break;
    case 'image':
      content = <ImageMessage message={message} />;
      framed = false;
      break;
    case 'video':
      content = <VideoMessage message={message} />;
      framed = false;
      break;
    case 'game':
      content = <GameBubble message={message} />;
      framed = false;
      break;
    default:
      return null;
  }

  const hasReactions = message.reactions?.length > 0;

  return (
    <View
      style={{
        width: '100%',
        alignItems: own ? 'flex-end' : 'flex-start',
        paddingHorizontal: 14,
        marginTop: hasReactions ? 10 : 0,
        marginBottom: showTail ? 8 : 2,
      }}
    >
      <Pressable
        onPress={open}
        onLongPress={() => {
          haptic.medium();
          onLongPress?.(message);
        }}
        delayLongPress={250}
        style={{ maxWidth: '80%' }}
      >
        {framed ? (
          <Bubble own={own} tail={showTail}>
            {content}
          </Bubble>
        ) : (
          content
        )}

        {hasReactions && (
          <View
            style={{
              position: 'absolute',
              top: -12,
              ...(own ? { left: -10 } : { right: -10 }),
              flexDirection: 'row',
              backgroundColor: '#fff',
              borderRadius: 12,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderWidth: 1,
              borderColor: '#E5E5EA',
            }}
          >
            <Text style={{ fontSize: 13 }}>{message.reactions.join('')}</Text>
          </View>
        )}
      </Pressable>

      {showStatus && own && (
        <Text style={{ fontSize: 11, color: '#8E8E93', marginTop: 3, marginRight: 4 }}>
          {STATUS_LABEL[message.status] ?? ''}
        </Text>
      )}
    </View>
  );
}
