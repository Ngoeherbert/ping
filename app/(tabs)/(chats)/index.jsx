import { View, FlatList, Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import Icon from "../../../src/components/Icon";
import MessageBubble from "../../../src/components/MessageBubble";

const IMG = "https://picsum.photos/id/1011/800/600";
const IMG_TALL = "https://picsum.photos/id/1025/600/900";

const MESSAGES = [
  { id: "1", type: "text", own: false, text: "Hey! Are you free later?" },
  { id: "2", type: "text", own: true, text: "Yes, what is up?" },
  { id: "3", type: "text", own: true, text: "Send me the files when you can." },
  { id: "4", type: "voice", own: false, duration: 24 },
  { id: "5", type: "voice", own: true, duration: 9, uri: null },
  { id: "6", type: "image", own: false, uri: IMG, width: 800, height: 600 },
  {
    id: "7",
    type: "image",
    own: true,
    uri: IMG_TALL,
    width: 600,
    height: 900,
    reactions: ["❤️"],
  },
  {
    id: "8",
    type: "video",
    own: false,
    thumb: IMG,
    width: 800,
    height: 600,
    duration: 47,
  },
  { id: "9", type: "viewOnce", own: true, mediaType: "image", opened: false },
  { id: "10", type: "viewOnce", own: false, mediaType: "video", opened: true },
  {
    id: "11",
    type: "file",
    own: true,
    fileName: "Ping-spec-v2.pdf",
    size: 2457600,
  },
  { id: "12", type: "file", own: false, fileName: "budget.xlsx", size: 48200 },
  {
    id: "13",
    type: "game",
    own: false,
    game: {
      type: "tictactoe",
      sessionId: "s1",
      status: "yourTurn",
      opponent: "Alex",
    },
  },
  {
    id: "14",
    type: "game",
    own: true,
    game: {
      type: "connectfour",
      sessionId: "s2",
      status: "waiting",
      opponent: "Alex",
    },
  },
  {
    id: "15",
    type: "game",
    own: false,
    game: {
      type: "wordguess",
      sessionId: "s3",
      status: "won",
      opponent: "Alex",
    },
  },
  {
    id: "16",
    type: "text",
    own: true,
    text: "Looks great!",
    status: "read",
    reactions: ["😂", "👍"],
  },
];

export default function ChatScreen() {
  const lastOwnIndex = MESSAGES.map((m) => m.own).lastIndexOf(true);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: "#fff" }}
    >
      <View
        style={{
          height: 52,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#E5E5EA",
          gap: 12,
        }}
      >
        <Pressable
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
          hitSlop={12}
        >
          <Icon icon={ArrowLeft01Icon} size={26} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600" }}>Bubble test</Text>
      </View>

      <FlatList
        data={MESSAGES}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingVertical: 16 }}
        renderItem={({ item, index }) => {
          const next = MESSAGES[index + 1];
          return (
            <MessageBubble
              message={item}
              showTail={!next || next.own !== item.own}
              showStatus={index === lastOwnIndex}
            />
          );
        }}
      />
    </SafeAreaView>
  );
}
