import { useUser } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../constants/colors";
import { API_URL } from "../../../constants/api";
import PageLoader from "../../../components/PageLoader";

export default function BalanceDetailScreen() {
  const { groupId } = useLocalSearchParams();
  const { user } = useUser();
  const router = useRouter();

  const [group, setGroup] = useState(null);
  const [balance, setBalance] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBalanceData();
  }, [groupId]);

  // Auto-refresh when screen comes into focus (after settling up)
  useFocusEffect(
    useCallback(() => {
      if (user?.id && groupId) {
        loadBalanceData();
      }
    }, [user?.id, groupId])
  );

  const loadBalanceData = async () => {
    if (!user?.id) return;
    try {
      // Load group
      const groupRes = await fetch(`${API_URL}/groups/${groupId}`);
      const groupData = await groupRes.json();
      setGroup(groupData);

      // Load balance
      const balanceRes = await fetch(`${API_URL}/groups/${groupId}/balance/${user.id}`);
      const balanceData = await balanceRes.json();
      setBalance(balanceData);

      // Load members
      const membersRes = await fetch(`${API_URL}/groups/${groupId}/members`);
      const membersData = await membersRes.json();
      setMembers(membersData);
    } catch (error) {
      console.error("Error loading balance data:", error);
      Alert.alert("Error", "Failed to load balance details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettleUp = (toUserId) => {
    Alert.alert(
      "Settle Up",
      `Mark all debts to ${toUserId} as paid?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Settle Up",
          style: "default",
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/groups/settle`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  groupId: parseInt(groupId),
                  fromUserId: user.id,
                  toUserId,
                }),
              });

              const data = await response.json();

              if (response.ok) {
                Alert.alert("Success", "Debts settled successfully!");
                loadBalanceData(); // Reload balance
              } else {
                Alert.alert("Error", data.message || "Failed to settle debts");
              }
            } catch (error) {
              console.error("Error settling up:", error);
              Alert.alert("Error", "Failed to settle debts");
            }
          },
        },
      ]
    );
  };

  if (isLoading) return <PageLoader />;

  const currencySymbol = group?.currency === "USD" ? "$" : "₹";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Balance Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overall Balance */}
        <View style={styles.overallCard}>
          <Ionicons
            name={
              balance?.netBalance > 0
                ? "trending-up"
                : balance?.netBalance < 0
                ? "trending-down"
                : "checkmark-circle"
            }
            size={48}
            color={
              balance?.netBalance > 0
                ? COLORS.income
                : balance?.netBalance < 0
                ? COLORS.expense
                : COLORS.primary
            }
          />
          <Text style={styles.overallLabel}>Your Net Balance</Text>
          <Text
            style={[
              styles.overallAmount,
              balance?.netBalance > 0 && styles.amountPositive,
              balance?.netBalance < 0 && styles.amountNegative,
            ]}
          >
            {balance?.netBalance > 0 ? "+" : ""}
            {currencySymbol}
            {Math.abs(balance?.netBalance || 0).toFixed(2)}
          </Text>
          <Text style={styles.overallSubtext}>
            {balance?.netBalance > 0
              ? "You are owed overall"
              : balance?.netBalance < 0
              ? "You owe overall"
              : "You're all settled up!"}
          </Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Ionicons name="arrow-up-circle" size={24} color={COLORS.income} />
            <Text style={styles.summaryLabel}>You Paid</Text>
            <Text style={styles.summaryAmount}>
              {currencySymbol}
              {(balance?.totalPaid || 0).toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Ionicons name="arrow-down-circle" size={24} color={COLORS.expense} />
            <Text style={styles.summaryLabel}>You Owe</Text>
            <Text style={styles.summaryAmount}>
              {currencySymbol}
              {(balance?.totalOwed || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* People Who Owe You */}
        {balance?.owesMe && balance.owesMe.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-add" size={20} color={COLORS.income} />
              <Text style={styles.sectionTitle}>People Who Owe You</Text>
            </View>
            {balance.owesMe.map((item, index) => (
              <View key={`owes-${index}`} style={styles.personCard}>
                <View style={styles.personLeft}>
                  <View style={styles.personIcon}>
                    <Ionicons name="person" size={20} color={COLORS.income} />
                  </View>
                  <Text style={styles.personName}>{item.userName || item.userId}</Text>
                </View>
                <Text style={styles.amountPositive}>
                  +{currencySymbol}
                  {item.amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* People You Owe */}
        {balance?.iOwe && balance.iOwe.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-remove" size={20} color={COLORS.expense} />
              <Text style={styles.sectionTitle}>People You Owe</Text>
            </View>
            {balance.iOwe.map((item, index) => (
              <View key={`iowe-${index}`} style={styles.personCard}>
                <View style={styles.personLeft}>
                  <View style={styles.personIcon}>
                    <Ionicons name="person" size={20} color={COLORS.expense} />
                  </View>
                  <View>
                    <Text style={styles.personName}>{item.userName || item.userId}</Text>
                    <Text style={styles.amountNegative}>
                      {currencySymbol}
                      {item.amount.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.settleButton}
                  onPress={() => handleSettleUp(item.userId)}
                >
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                  <Text style={styles.settleButtonText}>Settle</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* All Settled */}
        {(!balance?.owesMe || balance.owesMe.length === 0) &&
          (!balance?.iOwe || balance.iOwe.length === 0) && (
            <View style={styles.settledCard}>
              <Ionicons name="checkmark-circle" size={64} color={COLORS.primary} />
              <Text style={styles.settledTitle}>All Settled Up!</Text>
              <Text style={styles.settledText}>
                You don't owe anyone and nobody owes you in this group.
              </Text>
            </View>
          )}

        {/* Group Members */}
        {Array.isArray(members) && members.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Group Members ({members.length})</Text>
            </View>
            {members.map((member) => (
              <View key={member.user_id} style={styles.memberCard}>
                <View style={styles.personLeft}>
                  <View style={styles.personIcon}>
                    <Ionicons
                      name={member.user_id === user?.id ? "person" : "person-outline"}
                      size={20}
                      color={COLORS.primary}
                    />
                  </View>
                  <Text style={styles.personName}>
                    {member.user_id === user?.id ? "You" : (member.user_name || member.user_id)}
                  </Text>
                </View>
                <Text style={styles.memberDate}>
                  {new Date(member.joined_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
    paddingTop: 0,
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
  },
  scrollContent: {
    paddingBottom: 80,
  },
  overallCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  overallLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 12,
    marginBottom: 8,
  },
  overallAmount: {
    fontSize: 40,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  amountPositive: {
    color: COLORS.income,
  },
  amountNegative: {
    color: COLORS.expense,
  },
  overallSubtext: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: "center",
  },
  summaryCards: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 8,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  personCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  personLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  personIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  personName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  settledCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settledTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  settledText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "center",
    lineHeight: 20,
  },
  memberCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  memberDate: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  settleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  settleButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.white,
  },
});
