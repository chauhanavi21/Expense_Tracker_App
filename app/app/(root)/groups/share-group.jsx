import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../constants/colors";
import { API_URL } from "../../../constants/api";
import PageLoader from "../../../components/PageLoader";

export default function ShareGroupScreen() {
  const { groupId } = useLocalSearchParams();
  const router = useRouter();
  const [group, setGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGroup();
  }, [groupId]);

  const loadGroup = async () => {
    try {
      const response = await fetch(`${API_URL}/groups/${groupId}`);
      const data = await response.json();
      setGroup(data);
    } catch (error) {
      console.error("Error loading group:", error);
      Alert.alert("Error", "Failed to load group");
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = async () => {
    await Clipboard.setStringAsync(group?.code || "");
    Alert.alert("Copied!", "Group code copied to clipboard");
  };

  const shareGroup = async () => {
    try {
      const message = `Join my group "${group?.name}" on Expense Tracker!\n\nGroup Code: ${group?.code}\n\nOpen the app, go to Groups tab, and tap "Join Group" to enter this code.`;

      await Share.share({
        message,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Group</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="share-social" size={64} color={COLORS.primary} />
        </View>

        <Text style={styles.groupName}>{group?.name}</Text>
        <Text style={styles.infoText}>
          Share this code with friends so they can join your group
        </Text>

        {/* Code Display */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Group Code</Text>
          <Text style={styles.code}>{group?.code}</Text>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.primaryButton} onPress={shareGroup}>
          <Ionicons name="share-outline" size={20} color={COLORS.white} />
          <Text style={styles.primaryButtonText}>Share via...</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={copyCode}>
          <Ionicons name="copy-outline" size={20} color={COLORS.primary} />
          <Text style={styles.secondaryButtonText}>Copy Code</Text>
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How to join:</Text>
          <View style={styles.instructionRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.instructionText}>Open the app and go to Groups tab</Text>
          </View>
          <View style={styles.instructionRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.instructionText}>Tap "Join Group" button</Text>
          </View>
          <View style={styles.instructionRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.instructionText}>Enter the 6-character code</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  iconContainer: {
    alignSelf: "center",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  groupName: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  codeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  codeLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  code: {
    fontSize: 36,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 8,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 32,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  instructionsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 16,
  },
  instructionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
});
