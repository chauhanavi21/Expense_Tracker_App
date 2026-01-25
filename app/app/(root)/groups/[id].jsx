import { useUser } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
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

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useUser();
  const router = useRouter();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGroupData = async () => {
    if (!user?.id) return;
    try {
      // Load group details
      const groupRes = await fetch(`${API_URL}/groups/${id}`);
      const groupData = await groupRes.json();
      setGroup(groupData);

      // Load expenses
      const expensesRes = await fetch(`${API_URL}/groups/${id}/expenses`);
      const expensesData = await expensesRes.json();
      setExpenses(expensesData);

      // Load members
      const membersRes = await fetch(`${API_URL}/groups/${id}/members`);
      const membersData = await membersRes.json();
      setMembers(membersData);

      // Load balance
      const balanceRes = await fetch(`${API_URL}/groups/${id}/balance/${user.id}`);
      const balanceData = await balanceRes.json();
      setBalance(balanceData);
    } catch (error) {
      console.error("Error loading group data:", error);
      Alert.alert("Error", "Failed to load group data");
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroupData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadGroupData();
  }, [id, user?.id]);

  if (isLoading && !refreshing) return <PageLoader />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {group?.name}
        </Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => router.push(`/groups/share-group?groupId=${id}`)}
        >
          <Ionicons name="share-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        ListHeaderComponent={
          <>
            {/* Group Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Group Code</Text>
                <Text style={styles.infoValue}>{group?.code}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Members</Text>
                <Text style={styles.infoValue}>{members.length}</Text>
              </View>
            </View>

            {/* Balance Summary */}
            {balance && (
              <TouchableOpacity
                style={styles.balanceCard}
                onPress={() => router.push(`/groups/balance-detail?groupId=${id}`)}
              >
                <Text style={styles.balanceTitle}>Your Balance</Text>
                <Text
                  style={[
                    styles.balanceAmount,
                    balance.netBalance > 0 && styles.balancePositive,
                    balance.netBalance < 0 && styles.balanceNegative,
                  ]}
                >
                  {balance.netBalance > 0 ? "+" : ""}
                  {group?.currency === "USD" ? "$" : "₹"}
                  {Math.abs(balance.netBalance).toFixed(2)}
                </Text>
                <Text style={styles.balanceSubtext}>
                  {balance.netBalance > 0
                    ? "You are owed"
                    : balance.netBalance < 0
                    ? "You owe"
                    : "All settled up"}
                </Text>

                {/* Breakdown */}
                {(balance.owesMe.length > 0 || balance.iOwe.length > 0) && (
                  <View style={styles.breakdown}>
                    {balance.owesMe.map((item, index) => (
                      <View key={`owes-${index}`} style={styles.breakdownItem}>
                        <Text style={styles.breakdownLabel}>
                          {item.userId} owes you
                        </Text>
                        <Text style={styles.breakdownPositive}>
                          +{group?.currency === "USD" ? "$" : "₹"}
                          {item.amount.toFixed(2)}
                        </Text>
                      </View>
                    ))}
                    {balance.iOwe.map((item, index) => (
                      <View key={`iowe-${index}`} style={styles.breakdownItem}>
                        <Text style={styles.breakdownLabel}>
                          You owe {item.userId}
                        </Text>
                        <Text style={styles.breakdownNegative}>
                          -{group?.currency === "USD" ? "$" : "₹"}
                          {item.amount.toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.viewDetailsRow}>
                  <Text style={styles.viewDetailsText}>View Full Details</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                </View>
              </TouchableOpacity>
            )}

            {/* Expenses Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Expenses</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push(`/groups/add-expense?groupId=${id}`)}
              >
                <Ionicons name="add" size={20} color={COLORS.white} />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.expenseCard}
            onPress={() =>
              router.push(`/groups/expense-detail?expenseId=${item.id}&groupId=${id}`)
            }
          >
            <View style={styles.expenseLeft}>
              <Text style={styles.expenseDescription}>{item.description}</Text>
              <Text style={styles.expenseDate}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.expenseRight}>
              <Text style={styles.expenseAmount}>
                {group?.currency === "USD" ? "$" : "₹"}
                {parseFloat(item.amount).toFixed(2)}
              </Text>
              <Text style={styles.expensePaidBy}>
                {item.paid_by_user_id === user?.id ? "You paid" : "Paid by other"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No expenses yet</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
      />
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
  shareButton: {
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
    flex: 1,
    textAlign: "center",
    marginHorizontal: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  balanceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  balanceTitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  balancePositive: {
    color: COLORS.income,
  },
  balanceNegative: {
    color: COLORS.expense,
  },
  balanceSubtext: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 16,
  },
  breakdown: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
    gap: 8,
  },
  breakdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  breakdownLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  breakdownPositive: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.income,
  },
  breakdownNegative: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.expense,
  },
  viewDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  expenseCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  expenseLeft: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  expenseRight: {
    alignItems: "flex-end",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  expensePaidBy: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 12,
  },
});
