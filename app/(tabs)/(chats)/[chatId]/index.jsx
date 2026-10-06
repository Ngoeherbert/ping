import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  SafeAreaView,
  Image,
  Text,
} from "react-native";
import {
  GiftedChat,
  Composer,
  InputToolbar,
  Send,
} from "react-native-gifted-chat";
import Svg, { Path } from "react-native-svg";
import Icon from "../../../../src/components/Icon";

const ACCENT = "#FF4F81";
const SENT = "#007AFF"; // set to ACCENT for pink sent bubbles
const RECEIVED = "#F4F4F5";
const AVATAR =
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=facearea&facepad=2.5&w=256&h=256&q=80";

const ME = { _id: 1, name: "Me" };
const PEER = { _id: 2, name: "Wade Warren", avatar: AVATAR };

const minsAgo = (m) => new Date(Date.now() - m * 60000);

// Dummy messages, newest first (GiftedChat order)
const DUMMY_MESSAGES = [
  {
    _id: 5,
    text: "Of course! Please provide the account number or the name associated with the account.",
    createdAt: minsAgo(2),
    user: PEER,
  },
  {
    _id: 4,
    text: "It's account number 8745-2639.",
    createdAt: minsAgo(2),
    user: ME,
  },
  {
    _id: 3,
    text: "Of course! Please provide the account number or the name associated with the account.",
    createdAt: minsAgo(2),
    user: PEER,
  },
  {
    _id: 2,
    text: "Hi, I need help reviewing the recent transactions for a specific account. Can you pull up the details?",
    createdAt: minsAgo(2),
    user: ME,
  },
  {
    _id: 1,
    text: "Hello, how can I assist you with your banking and account management today?",
    createdAt: minsAgo(2),
    user: PEER,
  },
];

function timeAgo(date) {
  const mins = Math.max(
    0,
    Math.round((Date.now() - new Date(date).getTime()) / 60000),
  );
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}mins ago`;
  return `${Math.round(mins / 60)}h ago`;
}

// ---- Chat bubble (iMessage-style with tail) ----
function MessageBubble({ text, isMine, showTail, timestamp }) {
  const bg = isMine ? SENT : RECEIVED;
  const fg = isMine ? "#fff" : "#1C1C1E";

  return (
    <View
      style={[
        styles.bubbleWrap,
        isMine ? styles.bubbleWrapMine : styles.bubbleWrapTheirs,
      ]}
    >
      <View
        style={[
          styles.bubble,
          { backgroundColor: bg },
          showTail &&
            (isMine
              ? { borderBottomRightRadius: 6 }
              : { borderBottomLeftRadius: 6 }),
        ]}
      >
        <Text style={[styles.bubbleText, { color: fg }]}>{text}</Text>
        {showTail && (
          <Svg
            width={12}
            height={16}
            viewBox="0 0 12 16"
            style={[
              styles.tail,
              isMine
                ? { right: -7 }
                : { left: -7, transform: [{ scaleX: -1 }] },
            ]}
          >
            <Path d="M0 0 H6 C6 7 8 12 12 15 C8 16.5 3 16 0 13 Z" fill={bg} />
          </Svg>
        )}
      </View>
      {!!timestamp && (
        <Text
          style={[
            styles.bubbleTime,
            isMine ? { marginRight: 4 } : { marginLeft: 4 },
          ]}
        >
          {timestamp}
        </Text>
      )}
    </View>
  );
}

export default function ChatScreen() {
  const [messages, setMessages] = useState(DUMMY_MESSAGES);

  const onSend = useCallback((msgs = []) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, msgs),
    );
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.chatHeader}>
        <TouchableOpacity
          hitSlop={12}
          onPress={() => {
            // handle back
          }}
        >
          <Icon color="#1d1d1d" name="arrow-left" size={22} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            // handle profile press
          }}
          style={styles.chatHeaderProfile}
        >
          <View>
            <Image
              alt={`Avatar for ${PEER.name}`}
              style={styles.chatHeaderAvatar}
              source={{ uri: AVATAR }}
            />
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.chatHeaderBody}>
            <Text style={styles.chatHeaderTitle}>{PEER.name}</Text>
            <Text style={styles.chatHeaderSubtitle}>Active 8m ago</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          hitSlop={10}
          style={styles.headerIcon}
          onPress={() => {
            // handle call
          }}
        >
          <Icon color={ACCENT} name="phone" size={21} />
        </TouchableOpacity>
        <TouchableOpacity
          hitSlop={10}
          style={styles.headerIcon}
          onPress={() => {
            // handle video call
          }}
        >
          <Icon color={ACCENT} name="video" size={22} />
        </TouchableOpacity>
      </View>

      <GiftedChat
        listViewProps={{ style: { backgroundColor: "#fff" } }}
        renderInputToolbar={(props) => (
          <InputToolbar
            {...props}
            containerStyle={styles.chatInputToolbar}
            primaryStyle={{ alignItems: "center" }}
          />
        )}
        renderActions={() => (
          <TouchableOpacity style={[styles.chatActionWrapper, { left: 14 }]}>
            <Icon name="plus-circle" size={24} color="#6B7280" />
          </TouchableOpacity>
        )}
        renderComposer={(props) => (
          <Composer
            {...props}
            placeholder="Write your message"
            placeholderTextColor="#9CA3AF"
            textInputStyle={styles.chatComposer}
          />
        )}
        renderSend={(props) => (
          <Send
            {...props}
            disabled={!props.text}
            containerStyle={styles.chatSendWrap}
          >
            <View style={styles.chatSend}>
              <Icon name="send" size={20} color="#fff" />
            </View>
          </Send>
        )}
        renderBubble={(props) => {
          const msg = props.currentMessage;
          const next = props.nextMessage;
          const lastInGroup =
            !next || !next._id || next.user._id !== msg.user._id;
          return (
            <MessageBubble
              text={msg.text}
              isMine={props.position === "right"}
              showTail={lastInGroup}
              timestamp={lastInGroup ? timeAgo(msg.createdAt) : undefined}
            />
          );
        }}
        renderTime={() => null}
        renderDay={() => null}
        alwaysShowSend
        minInputToolbarHeight={72}
        minComposerHeight={54}
        messages={messages}
        onSend={(messages) => onSend(messages)}
        user={{ _id: ME._id }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  chatHeader: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  chatHeaderProfile: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 14,
  },
  chatHeaderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    backgroundColor: "#E5E7EB",
  },
  onlineDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#fff",
  },
  chatHeaderBody: {
    marginLeft: 12,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  chatHeaderTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1d1d1d",
  },
  chatHeaderSubtitle: {
    fontSize: 13,
    color: "#9c9c9c",
    marginTop: 2,
  },
  headerIcon: {
    marginLeft: 16,
  },

  bubbleWrap: { maxWidth: "78%", marginVertical: 2 },
  bubbleWrapMine: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
    marginRight: 14,
  },
  bubbleWrapTheirs: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
    marginLeft: 6,
  },
  bubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 22 },
  bubbleText: { fontSize: 15.5, lineHeight: 22 },
  bubbleTime: { fontSize: 12, color: "#6B7280", marginTop: 6, marginBottom: 8 },
  tail: { position: "absolute", bottom: 0 },

  chatInputToolbar: {
    borderTopWidth: 0,
    backgroundColor: "#fff",
    paddingTop: 8,
  },
  chatActionWrapper: {
    zIndex: 1,
    position: "absolute",
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  chatComposer: {
    color: "#1d1d1d",
    backgroundColor: "#F4F4F5",
    borderRadius: 28,
    paddingTop: 16,
    paddingLeft: 50,
    paddingRight: 14,
    marginLeft: 12,
    marginRight: 8,
    fontSize: 15,
  },
  chatSendWrap: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  chatSend: {
    backgroundColor: ACCENT,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
});
