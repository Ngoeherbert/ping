import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  HeartIcon,
  BookmarkIcon,
  VerifiedBadge,
} from "../../../src/constants/iconFiller";
import Icon from "../../../src/components/Icon";
import { haptic } from "../../../src/utils/haptics";

const Section = ({ title, children }) => (
  <View style={{ marginBottom: 28 }}>
    <Text
      style={{
        fontSize: 13,
        color: "#8E8E93",
        marginBottom: 12,
        textTransform: "uppercase",
      }}
    >
      {title}
    </Text>
    {children}
  </View>
);

const Row = ({ children }) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 24 }}>
    {children}
  </View>
);

const Label = ({ children }) => (
  <Text
    style={{
      fontSize: 11,
      color: "#8E8E93",
      marginTop: 6,
      textAlign: "center",
    }}
  >
    {children}
  </Text>
);

const Item = ({ label, children }) => (
  <View style={{ alignItems: "center" }}>
    {children}
    <Label>{label}</Label>
  </View>
);

export default function Home() {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: "#fff" }}
    >
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 24 }}>
          Icon check
        </Text>

        <Section title="Outline vs filled">
          <Row>
            <Item label="heart">
              <HeartIcon active={false} size={32} />
            </Item>
            <Item label="heart active">
              <HeartIcon active size={32} />
            </Item>
            <Item label="bookmark">
              <BookmarkIcon active={false} size={32} />
            </Item>
            <Item label="bookmark active">
              <BookmarkIcon active size={32} />
            </Item>
            <Item label="verified">
              <VerifiedBadge size={32} />
            </Item>
          </Row>
        </Section>

        <Section title="Tap to toggle">
          <Row>
            <Pressable
              onPress={() => {
                haptic.light();
                setLiked((v) => !v);
              }}
              hitSlop={12}
            >
              <HeartIcon active={liked} size={32} />
            </Pressable>
            <Pressable
              onPress={() => {
                haptic.light();
                setSaved((v) => !v);
              }}
              hitSlop={12}
            >
              <BookmarkIcon active={saved} size={32} />
            </Pressable>
          </Row>
          <Text style={{ marginTop: 10, color: "#8E8E93" }}>
            liked: {String(liked)} | saved: {String(saved)}
          </Text>
        </Section>

        <Section title="Sizes">
          <Row>
            {[16, 20, 24, 32, 44].map((s) => (
              <Item key={s} label={`${s}`}>
                <HeartIcon active size={s} />
              </Item>
            ))}
          </Row>
          <View style={{ height: 16 }} />
          <Row>
            {[14, 16, 18, 24, 32].map((s) => (
              <Item key={s} label={`${s}`}>
                <VerifiedBadge size={s} />
              </Item>
            ))}
          </Row>
        </Section>

        <Section title="Colors">
          <Row>
            <Item label="default">
              <BookmarkIcon active size={28} />
            </Item>
            <Item label="blue">
              <BookmarkIcon active size={28} color="#0A84FF" />
            </Item>
            <Item label="green">
              <BookmarkIcon active size={28} color="#34C759" />
            </Item>
            <Item label="purple">
              <BookmarkIcon active size={28} color="#AF52DE" />
            </Item>
            <Item label="gold badge">
              <VerifiedBadge size={28} color="#F5B301" />
            </Item>
          </Row>
        </Section>

        <Section title="Next to a username">
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ fontSize: 17, fontWeight: "600" }}>Robert</Text>
            <VerifiedBadge size={18} />
          </View>
        </Section>

        <Section title="Through Icon.jsx (name prop)">
          <Row>
            <Item label="heart">
              <Icon name="heart" active size={28} />
            </Item>
            <Item label="bookmark">
              <Icon name="bookmark" active size={28} />
            </Item>
            <Item label="verified">
              <Icon name="verified" size={28} />
            </Item>
          </Row>
        </Section>

        <Section title="On dark">
          <View
            style={{ backgroundColor: "#111", padding: 16, borderRadius: 12 }}
          >
            <Row>
              <HeartIcon active size={28} />
              <BookmarkIcon active size={28} color="#fff" />
              <BookmarkIcon active={false} size={28} color="#fff" />
              <VerifiedBadge size={28} />
            </Row>
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
