import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Pressable,
  View,
  SafeAreaView,
  Image,
  Text,
  Modal,
  ScrollView,
  Keyboard,
  BackHandler,
  Platform,
} from "react-native";
import { GiftedChat, Composer, Send } from "react-native-gifted-chat";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import * as Clipboard from "expo-clipboard";
import Icon from "../../../../src/components/Icon";

const ACCENT = "#FF4F81";
const SENT = "#007AFF";
const RECEIVED = "#F4F4F5";
const DANGER = "#EF4444";

const AVATAR =
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=facearea&facepad=2.5&w=256&h=256&q=80";

const REACTIONS = ["🔥", "🙌", "😭", "🙈", "🙏", "😖", "👍", "❤️"];

const DEFAULT_PANEL_HEIGHT = 300;

const STRINGS = {
  composer: {
    placeholder: "Type a message…",
  },

  header: {
    activeAgo: (time) => `Active ${time}`,
    avatarAlt: (name) => `Avatar for ${name}`,
    back: "Go back",
  },

  time: {
    justNow: "Just now",
    minsAgo: (m) => `${m} min${m === 1 ? "" : "s"} ago`,
    hoursAgo: (h) => `${h}h ago`,
  },

  actions: {
    react: "React",
    copy: "Copy",
    reply: "Reply",
    forward: "Forward",
    delete: "Delete",
  },

  reply: {
    replyingTo: (name) => `Replying to ${name}`,
  },

  attach: {
    title: "Share",
    photo: "Photos",
    camera: "Camera",
    file: "Files",
    location: "Location",
    contact: "Contact",
    audio: "Audio",
  },

  stickers: {
    title: "Stickers & GIFs",
    stickers: "Stickers",
    gifs: "GIFs",
  },
};

const ATTACH_ITEMS = [
  {
    key: "photo",
    label: STRINGS.attach.photo,
    icon: "image",
    color: "#3B82F6",
  },
  {
    key: "camera",
    label: STRINGS.attach.camera,
    icon: "camera",
    color: ACCENT,
  },
  {
    key: "file",
    label: STRINGS.attach.file,
    icon: "file",
    color: "#F59E0B",
  },
  {
    key: "location",
    label: STRINGS.attach.location,
    icon: "map-pin",
    color: "#22C55E",
  },
  {
    key: "contact",
    label: STRINGS.attach.contact,
    icon: "user",
    color: "#8B5CF6",
  },
  {
    key: "audio",
    label: STRINGS.attach.audio,
    icon: "mic",
    color: "#EF4444",
  },
];

const ME = {
  _id: 1,
  name: "Me",
};

const PEER = {
  _id: 2,
  name: "Wade Warren",
  avatar: AVATAR,
};

const minsAgo = (m) => new Date(Date.now() - m * 60000);

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

  if (mins < 1) return STRINGS.time.justNow;
  if (mins < 60) return STRINGS.time.minsAgo(mins);

  return STRINGS.time.hoursAgo(Math.round(mins / 60));
}

function MessageBubble({
  text,
  isMine,
  showTail,
  timestamp,
  reaction,
  replyTo,
  onLongPress,
}) {
  const bg = isMine ? SENT : RECEIVED;
  const fg = isMine ? "#fff" : "#1C1C1E";

  return (
    <View
      style={[
        styles.bubbleWrap,
        isMine ? styles.bubbleWrapMine : styles.bubbleWrapTheirs,
      ]}
    >
      <Pressable onLongPress={onLongPress} delayLongPress={300}>
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
          {!!replyTo && (
            <View
              style={[
                styles.quote,
                {
                  borderLeftColor: isMine ? "#fff" : ACCENT,
                  backgroundColor: isMine
                    ? "rgba(255,255,255,0.18)"
                    : "rgba(0,0,0,0.05)",
                },
              ]}
            >
              <Text style={[styles.quoteName, { color: fg }]}>
                {replyTo.name}
              </Text>

              <Text numberOfLines={2} style={[styles.quoteText, { color: fg }]}>
                {replyTo.text}
              </Text>
            </View>
          )}

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
                  : {
                      left: -7,
                      transform: [{ scaleX: -1 }],
                    },
              ]}
            >
              <Path d="M0 0 H6 C6 7 8 12 12 15 C8 16.5 3 16 0 13 Z" fill={bg} />
            </Svg>
          )}
        </View>
      </Pressable>

      {!!reaction && (
        <View style={styles.reactionPill}>
          <Text style={styles.reactionPillText}>{reaction}</Text>
        </View>
      )}

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

function MessageActionSheet({ message, onClose, onReact, onAction }) {
  const visible = !!message;

  const rows = [
    {
      key: "copy",
      label: STRINGS.actions.copy,
      icon: "copy",
    },
    {
      key: "reply",
      label: STRINGS.actions.reply,
      icon: "reply",
    },
    {
      key: "forward",
      label: STRINGS.actions.forward,
      icon: "forward",
    },
    {
      key: "delete",
      label: STRINGS.actions.delete,
      icon: "delete",
      danger: true,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.sheetRoot}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView
            intensity={40}
            tint="dark"
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.sheetDim} />
        </Pressable>

        <View style={styles.sheet}>
          <View style={styles.sheetPreview}>
            <Text style={styles.sheetPreviewText} numberOfLines={3}>
              {message?.text}
            </Text>
          </View>

          <Text style={styles.sheetSectionTitle}>{STRINGS.actions.react}</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.reactionRow}
          >
            {REACTIONS.map((emoji) => {
              const active = message?.reaction === emoji;

              return (
                <TouchableOpacity
                  key={emoji}
                  activeOpacity={0.6}
                  style={[
                    styles.reactionBtn,
                    active && styles.reactionBtnActive,
                  ]}
                  onPress={() => onReact(emoji)}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.actionList}>
            {rows.map((row, i) => (
              <TouchableOpacity
                key={row.key}
                activeOpacity={0.6}
                style={[
                  styles.actionRow,
                  i < rows.length - 1 && styles.actionRowDivider,
                ]}
                onPress={() => onAction(row.key)}
              >
                <Text
                  style={[
                    styles.actionLabel,
                    row.danger && {
                      color: DANGER,
                    },
                  ]}
                >
                  {row.label}
                </Text>

                <Icon
                  name={row.icon}
                  size={18}
                  color={row.danger ? DANGER : "#1d1d1d"}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function AttachmentPanel({ height, onSelect }) {
  return (
    <View style={[styles.attachPanel, { height }]}>
      <View style={styles.attachHandle} />

      <Text style={styles.attachTitle}>{STRINGS.attach.title}</Text>

      <View style={styles.attachGrid}>
        {ATTACH_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.key}
            activeOpacity={0.6}
            style={styles.attachItem}
            onPress={() => onSelect(item.key)}
          >
            <View
              style={[
                styles.attachIconWrap,
                {
                  backgroundColor: item.color,
                },
              ]}
            >
              <Icon name={item.icon} size={24} color="#fff" />
            </View>

            <Text style={styles.attachLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const STICKER_PACKS = [
  {
    id: "cuppy",
    name: "Cuppy",
    stickers: [
      {
        id: "cuppy-smile",
        uri: "https://raw.githubusercontent.com/WhatsApp/stickers/master/Android/app/src/main/assets/1/01_Cuppy_smile.webp",
      },
      {
        id: "cuppy-lol",
        uri: "https://raw.githubusercontent.com/WhatsApp/stickers/master/Android/app/src/main/assets/1/02_Cuppy_lol.webp",
      },
      {
        id: "cuppy-rofl",
        uri: "https://raw.githubusercontent.com/WhatsApp/stickers/master/Android/app/src/main/assets/1/03_Cuppy_rofl.webp",
      },
      {
        id: "cuppy-sad",
        uri: "https://raw.githubusercontent.com/WhatsApp/stickers/master/Android/app/src/main/assets/1/04_Cuppy_sad.webp",
      },
      {
        id: "cuppy-cry",
        uri: "https://raw.githubusercontent.com/WhatsApp/stickers/master/Android/app/src/main/assets/1/05_Cuppy_cry.webp",
      },
      {
        id: "cuppy-love",
        uri: "https://raw.githubusercontent.com/WhatsApp/stickers/master/Android/app/src/main/assets/1/06_Cuppy_love.webp",
      },
      {
        id: "cuppy-shine",
        uri: "https://raw.githubusercontent.com/WhatsApp/stickers/master/Android/app/src/main/assets/1/19_Cuppy_shine.webp",
      },
      {
        id: "cuppy-hi",
        uri: "https://raw.githubusercontent.com/WhatsApp/stickers/master/Android/app/src/main/assets/1/21_Cuppy_hi.webp",
      },
      {
        id: "cuppy-bye",
        uri: "https://raw.githubusercontent.com/WhatsApp/stickers/master/Android/app/src/main/assets/1/22_Cuppy_bye.webp",
      },
      {
        id: "cuppy-greentea",
        uri: "https://raw.githubusercontent.com/WhatsApp/stickers/master/Android/app/src/main/assets/1/23_Cuppy_greentea.webp",
      },
      {
        id: "cuppy-phone",
        uri: "https://raw.githubusercontent.com/WhatsApp/stickers/master/Android/app/src/main/assets/1/24_Cuppy_phone.webp",
      },
      {
        id: "cuppy-battery",
        uri: "https://raw.githubusercontent.com/WhatsApp/stickers/master/Android/app/src/main/assets/1/25_Cuppy_battery.webp",
      },
    ],
  },
];

function StickerGifPanel({ height, onStickerSelect }) {
  const [activeTab, setActiveTab] = useState("stickers");
  const [activePack, setActivePack] = useState("cuppy");

  const currentPack =
    STICKER_PACKS.find((pack) => pack.id === activePack) || STICKER_PACKS[0];

  return (
    <View style={[styles.attachPanel, { height }]}>
      <View style={styles.attachHandle} />

      <View style={styles.stickerHeader}>
        <Text style={styles.attachTitle}>{STRINGS.stickers.title}</Text>

        <View style={styles.stickerTabs}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.stickerTab,
              activeTab === "stickers" && styles.stickerTabActive,
            ]}
            onPress={() => setActiveTab("stickers")}
          >
            <Text
              style={[
                styles.stickerTabText,
                activeTab === "stickers" && styles.stickerTabTextActive,
              ]}
            >
              {STRINGS.stickers.stickers}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.stickerTab,
              activeTab === "gifs" && styles.stickerTabActive,
            ]}
            onPress={() => setActiveTab("gifs")}
          >
            <Text
              style={[
                styles.stickerTabText,
                activeTab === "gifs" && styles.stickerTabTextActive,
              ]}
            >
              {STRINGS.stickers.gifs}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === "stickers" ? (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.stickerGrid}
          >
            {currentPack.stickers.map((sticker) => (
              <TouchableOpacity
                key={sticker.id}
                activeOpacity={0.65}
                style={styles.stickerItem}
                onPress={() => onStickerSelect(sticker)}
              >
                <Image
                  source={{ uri: sticker.uri }}
                  style={styles.stickerImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.stickerPackBar}>
            {STICKER_PACKS.map((pack) => {
              const active = pack.id === activePack;

              return (
                <TouchableOpacity
                  key={pack.id}
                  activeOpacity={0.7}
                  style={[
                    styles.stickerPackButton,
                    active && styles.stickerPackButtonActive,
                  ]}
                  onPress={() => setActivePack(pack.id)}
                >
                  <Image
                    source={{
                      uri: pack.stickers[0].uri,
                    }}
                    style={styles.stickerPackPreview}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : (
        <View style={styles.emptyGifState}>
          <View style={styles.emptyGifIcon}>
            <Text style={styles.gifIconText}>GIF</Text>
          </View>

          <Text style={styles.emptyGifTitle}>GIFs</Text>

          <Text style={styles.emptyGifText}>GIF search will appear here.</Text>
        </View>
      )}
    </View>
  );
}

export default function ChatScreen({ navigation }) {
  const [messages, setMessages] = useState(DUMMY_MESSAGES);

  const [headerHeight, setHeaderHeight] = useState(0);

  const [selected, setSelected] = useState(null);

  const [replyTo, setReplyTo] = useState(null);

  const [panelOpen, setPanelOpen] = useState(false);

  const [panelType, setPanelType] = useState(null);

  const [panelHeight, setPanelHeight] = useState(DEFAULT_PANEL_HEIGHT);

  const composerRef = useRef(null);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";

    const sub = Keyboard.addListener(showEvt, (e) => {
      const h = e?.endCoordinates?.height;

      if (h) {
        setPanelHeight(h);
      }
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!panelOpen) return;

    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setPanelOpen(false);
      setPanelType(null);
      return true;
    });

    return () => sub.remove();
  }, [panelOpen]);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setPanelType(null);
  }, []);

  const toggleAttachments = useCallback(() => {
    Haptics.selectionAsync();

    if (panelOpen && panelType === "attachments") {
      closePanel();

      setTimeout(() => {
        composerRef.current?.focus();
      }, 50);

      return;
    }

    Keyboard.dismiss();

    setPanelType("attachments");
    setPanelOpen(true);
  }, [panelOpen, panelType, closePanel]);

  const toggleStickers = useCallback(() => {
    Haptics.selectionAsync();

    if (panelOpen && panelType === "stickers") {
      closePanel();

      setTimeout(() => {
        composerRef.current?.focus();
      }, 50);

      return;
    }

    Keyboard.dismiss();

    setPanelType("stickers");
    setPanelOpen(true);
  }, [panelOpen, panelType, closePanel]);

  const showKeyboard = useCallback(() => {
    Haptics.selectionAsync();

    closePanel();

    setTimeout(() => {
      composerRef.current?.focus();
    }, 50);
  }, [closePanel]);

  const handleAttach = useCallback(
    (key) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      closePanel();

      switch (key) {
        case "photo":
          break;

        case "camera":
          break;

        case "file":
          break;

        case "location":
          break;

        case "contact":
          break;

        case "audio":
          break;

        default:
          break;
      }
    },
    [closePanel],
  );

  const handleStickerSelect = useCallback(
    (sticker) => {
      if (!sticker?.uri) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const stickerMessage = {
        _id: `sticker-${Date.now()}`,
        text: "",
        sticker: true,
        stickerUri: sticker.uri,
        createdAt: new Date(),
        user: ME,
      };

      setMessages((prev) => GiftedChat.append(prev, [stickerMessage]));

      closePanel();
    },
    [closePanel],
  );

  const onSend = useCallback(
    (msgs = []) => {
      const withReply = replyTo
        ? msgs.map((m) => ({
            ...m,
            replyTo: {
              _id: replyTo._id,
              name: replyTo.user.name,
              text: replyTo.text,
            },
          }))
        : msgs;

      setMessages((prev) => GiftedChat.append(prev, withReply));

      setReplyTo(null);
    },
    [replyTo],
  );

  const openSheet = useCallback((message) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setSelected(message);
  }, []);

  const closeSheet = useCallback(() => {
    setSelected(null);
  }, []);

  const handleReact = useCallback(
    (emoji) => {
      if (!selected) return;

      Haptics.selectionAsync();

      setMessages((prev) =>
        prev.map((m) =>
          m._id === selected._id
            ? {
                ...m,
                reaction: m.reaction === emoji ? undefined : emoji,
              }
            : m,
        ),
      );

      closeSheet();
    },
    [selected, closeSheet],
  );

  const handleAction = useCallback(
    async (action) => {
      if (!selected) return;

      const msg = selected;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      closeSheet();

      switch (action) {
        case "copy":
          await Clipboard.setStringAsync(msg.text);
          break;

        case "reply":
          setReplyTo(msg);
          break;

        case "forward":
          break;

        case "delete":
          setMessages((prev) => prev.filter((m) => m._id !== msg._id));
          break;

        default:
          break;
      }
    },
    [selected, closeSheet],
  );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#fff",
      }}
    >
      <View
        style={styles.chatHeader}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <TouchableOpacity
          hitSlop={12}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={STRINGS.header.back}
          onPress={() => {
            Haptics.selectionAsync();
            navigation?.goBack?.();
          }}
        >
          <Icon color="#1d1d1d" name="back" size={22} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {}} style={styles.chatHeaderProfile}>
          <View>
            <Image
              alt={STRINGS.header.avatarAlt(PEER.name)}
              style={styles.chatHeaderAvatar}
              source={{
                uri: AVATAR,
              }}
            />

            <View style={styles.onlineDot} />
          </View>

          <View style={styles.chatHeaderBody}>
            <Text style={styles.chatHeaderTitle}>{PEER.name}</Text>

            <Text style={styles.chatHeaderSubtitle}>
              {STRINGS.header.activeAgo("8m ago")}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          hitSlop={10}
          style={styles.headerIcon}
          onPress={() => {}}
        >
          <Icon color={ACCENT} name="phone" size={21} />
        </TouchableOpacity>

        <TouchableOpacity
          hitSlop={10}
          style={styles.headerIcon}
          onPress={() => {}}
        >
          <Icon color={ACCENT} name="video" size={22} />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        <GiftedChat
          listViewProps={{
            style: {
              backgroundColor: "#fff",
            },
            onScrollBeginDrag: closePanel,
          }}
          keyboardAvoidingViewProps={{
            keyboardVerticalOffset: headerHeight + insets.top,
          }}
          renderInputToolbar={(props) => {
            const hasText = !!props.text?.trim();

            const attachmentOpen = panelOpen && panelType === "attachments";

            const stickersOpen = panelOpen && panelType === "stickers";

            return (
              <View>
                {!!replyTo && (
                  <View style={styles.replyBar}>
                    <View style={styles.replyBarBody}>
                      <Text style={styles.replyBarName}>
                        {STRINGS.reply.replyingTo(replyTo.user.name)}
                      </Text>

                      <Text style={styles.replyBarText} numberOfLines={1}>
                        {replyTo.text}
                      </Text>
                    </View>

                    <TouchableOpacity
                      hitSlop={10}
                      onPress={() => setReplyTo(null)}
                    >
                      <Icon name="close" size={18} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.inputRow}>
                  <TouchableOpacity
                    hitSlop={8}
                    style={[
                      styles.roundBtn,
                      attachmentOpen && styles.roundBtnActive,
                    ]}
                    onPress={() => {
                      if (attachmentOpen) {
                        showKeyboard();
                      } else {
                        toggleAttachments();
                      }
                    }}
                  >
                    <Icon
                      name={attachmentOpen ? "keyboard" : "create"}
                      size={22}
                      color={attachmentOpen ? "#fff" : "#6B7280"}
                    />
                  </TouchableOpacity>

                  <View style={styles.inputPill}>
                    <View style={{ flex: 1 }}>
                      <Composer
                        {...props}
                        placeholder={STRINGS.composer.placeholder}
                        placeholderTextColor="#9CA3AF"
                        textInputStyle={styles.chatComposer}
                        textInputProps={{
                          ref: composerRef,
                          onFocus: closePanel,
                        }}
                      />
                    </View>

                    <TouchableOpacity
                      hitSlop={8}
                      onPress={() => {
                        if (stickersOpen) {
                          showKeyboard();
                        } else {
                          toggleStickers();
                        }
                      }}
                    >
                      <Icon
                        name={stickersOpen ? "keyboard" : "sticker"}
                        size={20}
                        color={stickersOpen ? ACCENT : "#6B7280"}
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    hitSlop={8}
                    style={styles.roundBtn}
                    onPress={() => {}}
                  >
                    <Icon name="camera" size={20} color="#6B7280" />
                  </TouchableOpacity>

                  {hasText ? (
                    <Send {...props} containerStyle={styles.sendWrap}>
                      <View style={styles.sendBtn}>
                        <Icon name="send" size={20} color="#fff" />
                      </View>
                    </Send>
                  ) : (
                    <TouchableOpacity
                      style={[styles.sendBtn, styles.sendWrap]}
                      onPress={() => {}}
                    >
                      <Icon name="mic" size={20} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
          renderBubble={(props) => {
            const msg = props.currentMessage;

            if (msg?.stickerUri) {
              return (
                <View
                  style={[
                    styles.stickerMessageWrap,
                    props.position === "right"
                      ? styles.stickerMessageMine
                      : styles.stickerMessageTheirs,
                  ]}
                >
                  <Pressable
                    onLongPress={() => openSheet(msg)}
                    delayLongPress={300}
                  >
                    <Image
                      source={{
                        uri: msg.stickerUri,
                      }}
                      style={styles.sentSticker}
                      resizeMode="contain"
                    />
                  </Pressable>

                  {msg.reaction && (
                    <View style={styles.reactionPill}>
                      <Text style={styles.reactionPillText}>
                        {msg.reaction}
                      </Text>
                    </View>
                  )}

                  <Text
                    style={[
                      styles.bubbleTime,
                      props.position === "right"
                        ? {
                            marginRight: 4,
                          }
                        : {
                            marginLeft: 4,
                          },
                    ]}
                  >
                    {timeAgo(msg.createdAt)}
                  </Text>
                </View>
              );
            }

            const next = props.nextMessage;

            const lastInGroup =
              !next || !next._id || next.user._id !== msg.user._id;

            return (
              <MessageBubble
                text={msg.text}
                isMine={props.position === "right"}
                showTail={lastInGroup}
                timestamp={lastInGroup ? timeAgo(msg.createdAt) : undefined}
                reaction={msg.reaction}
                replyTo={msg.replyTo}
                onLongPress={() => openSheet(msg)}
              />
            );
          }}
          renderTime={() => null}
          renderDay={() => null}
          alwaysShowSend
          minInputToolbarHeight={66}
          minComposerHeight={50}
          messages={messages}
          onSend={(messages) => onSend(messages)}
          user={{
            _id: ME._id,
          }}
        />

        {panelOpen && panelType === "attachments" && (
          <AttachmentPanel height={panelHeight} onSelect={handleAttach} />
        )}

        {panelOpen && panelType === "stickers" && (
          <StickerGifPanel
            height={panelHeight}
            onStickerSelect={handleStickerSelect}
          />
        )}
      </View>

      <MessageActionSheet
        message={selected}
        onClose={closeSheet}
        onReact={handleReact}
        onAction={handleAction}
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

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F4F4F5",
    alignItems: "center",
    justifyContent: "center",
  },

  chatHeaderProfile: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
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

  bubbleWrap: {
    maxWidth: "78%",
    marginVertical: 2,
  },

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

  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
  },

  bubbleText: {
    fontSize: 15.5,
    lineHeight: 22,
  },

  bubbleTime: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
    marginBottom: 8,
  },

  tail: {
    position: "absolute",
    bottom: 0,
  },

  quote: {
    borderLeftWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },

  quoteName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },

  quoteText: {
    fontSize: 13,
    opacity: 0.85,
  },

  reactionPill: {
    marginTop: -8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  reactionPillText: {
    fontSize: 14,
  },

  stickerMessageWrap: {
    marginVertical: 2,
    maxWidth: "75%",
  },

  stickerMessageMine: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
    marginRight: 14,
  },

  stickerMessageTheirs: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
    marginLeft: 6,
  },

  sentSticker: {
    width: 170,
    height: 170,
  },

  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F4F4F5",
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
  },

  replyBarBody: {
    flex: 1,
    marginRight: 8,
  },

  replyBarName: {
    fontSize: 12,
    fontWeight: "600",
    color: ACCENT,
  },

  replyBarText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },

  sheetRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  sheetDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  sheet: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 12,
  },

  sheetPreview: {
    backgroundColor: "#F7F7F8",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  sheetPreviewText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#1d1d1d",
  },

  sheetSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1d1d1d",
    marginTop: 20,
    marginBottom: 10,
  },

  reactionRow: {
    alignItems: "center",
    paddingRight: 8,
  },

  reactionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  reactionBtnActive: {
    backgroundColor: "#F4F4F5",
  },

  reactionEmoji: {
    fontSize: 30,
  },

  actionList: {
    marginTop: 8,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },

  actionRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },

  actionLabel: {
    fontSize: 15,
    color: "#1d1d1d",
  },

  attachPanel: {
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  attachHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    marginBottom: 14,
  },

  attachTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1d1d1d",
    marginBottom: 16,
  },

  attachGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 20,
  },

  attachItem: {
    width: "33.333%",
    alignItems: "center",
  },

  attachIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  attachLabel: {
    fontSize: 13,
    color: "#1d1d1d",
  },

  stickerHeader: {
    marginBottom: 8,
  },

  stickerTabs: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#F4F4F5",
    borderRadius: 10,
    padding: 3,
  },

  stickerTab: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  stickerTabActive: {
    backgroundColor: "#fff",
  },

  stickerTabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },

  stickerTabTextActive: {
    color: "#1d1d1d",
    fontWeight: "600",
  },

  stickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingBottom: 30,
  },

  stickerItem: {
    width: "25%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  stickerImage: {
    width: 76,
    height: 76,
  },

  stickerPackBar: {
    height: 64,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  stickerPackButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  stickerPackButtonActive: {
    backgroundColor: "#F4F4F5",
  },

  stickerPackPreview: {
    width: 40,
    height: 40,
  },

  emptyGifState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40,
  },

  emptyGifIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F4F4F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  gifIconText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#9CA3AF",
  },

  emptyGifTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1d1d1d",
    marginBottom: 4,
  },

  emptyGifText: {
    fontSize: 13,
    color: "#9CA3AF",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: "#fff",
  },

  roundBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F4F4F5",
    alignItems: "center",
    justifyContent: "center",
  },

  roundBtnActive: {
    backgroundColor: ACCENT,
  },

  inputPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F4F5",
    borderRadius: 25,
    minHeight: 50,
    paddingRight: 14,
    paddingTop: 5,
    paddingLeft: 10,
  },

  chatComposer: {
    color: "#1d1d1d",
    fontSize: 15,
    marginLeft: 0,
    marginRight: 0,
    paddingLeft: 16,
    paddingRight: 8,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: "transparent",
  },

  sendWrap: {
    justifyContent: "center",
    alignItems: "center",
  },

  sendBtn: {
    backgroundColor: ACCENT,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
