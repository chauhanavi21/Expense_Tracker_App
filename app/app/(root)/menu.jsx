import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import { SignOutButton } from "../../components/SignOutButton";

const formatSince = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

export default function MenuScreen() {
  const router = useRouter();
  const { user } = useUser();

  const name =
    user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";
  const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress;
  const userSince = formatSince(user?.createdAt);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Menu</Text>
        <View style={{ width: 42 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Profile</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{name}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{email || "-"}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>User since</Text>
          <Text style={styles.value}>{userSince || "-"}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <SignOutButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  iconButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: COLORS.card,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  row: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  label: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  footer: {
    marginTop: 16,
    alignItems: "flex-end",
  },
});

