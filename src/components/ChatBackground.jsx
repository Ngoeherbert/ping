import { Image, StyleSheet, View } from "react-native";
import { glassColors } from "../theme/chatTheme";

// Blurred photo wallpaper with a dark wash so text stays readable.
export default function ChatBackground({ uri }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        blurRadius={28}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: glassColors.wash }]} />
    </View>
  );
}
