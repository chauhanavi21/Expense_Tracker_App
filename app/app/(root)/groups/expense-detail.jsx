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

export default function ExpenseDetailScreen() {
  const { expenseId, groupId } = useLocalSearchParams();
  const { user } = useUser();
  const router = useRouter();

  const [expense, setExpense] = useState(null);
  const [splits, setSplits] = useState([]);
  const [group, setGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExpenseDetail();
  }, [expenseId]);

  // Auto-refresh when screen comes into focus (after editing)
  useFocusEffect(
    useCallback(() => {
      if (expenseId && groupId) {
        loadExpenseDetail();
      }
    }, [expenseId, groupId])
  );

  const loadExpenseDetail = async () => {
    try {
      // Load group info for currency
      const groupRes = await fetch(`${API_URL}/groups/${groupId}`);
      const groupData = await groupRes.json();
      setGroup(groupData);

      // Load expense details
      const expenseRes = await fetch(`${API_URL}/groups/${groupId}/expenses`);
      const expensesData = await expenseRes.json();
      const expenseDetail = expensesData.find((e) => e.id === parseInt(expenseId));
      setExpense(expenseDetail);

      // Load splits
      const splitsRes = await fetch(`${API_URL}/groups/expenses/${expenseId}/splits`);
      const splitsData = await splitsRes.json();
      setSplits(splitsData);
    } catch (error) {
      console.error("Error loading expense detail:", error);
      Alert.alert("Error", "Failed to load expense details");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <PageLoader />;

  const currencySymbol = group?.currency === "USD" ? "$" : "₹";
  const paidByYou = expense?.paid_by_user_id === user?.id;

  const handleEdit = () => {
    router.push(`/groups/edit-expense?expenseId=${expenseId}&groupId=${groupId}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expense Details</Text>
        {paidByYou && (
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        {!paidByYou && <View style={{ width: 44 }} />}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Expense Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.categoryIcon}>
            <Ionicons name="receipt" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.description}>{expense?.description}</Text>
          <Text style={styles.amount}>
            {currencySymbol}
            {parseFloat(expense?.amount || 0).toFixed(2)}
          </Text>
          <Text style={styles.category}>{expense?.category}</Text>
          <Text style={styles.date}>
            {new Date(expense?.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        {/* Paid By Card */}
        <View style={styles.paidByCard}>
          <View style={styles.paidByHeader}>
            <Ionicons name="card-outline" size={20} color={COLORS.primary} />
            <Text style={styles.paidByTitle}>Paid By</Text>
          </View>
          <Text style={styles.paidByName}>
            {paidByYou ? "You" : (expense?.paid_by_user_name || expense?.paid_by_user_id)}
          </Text>
        </View>

        {/* Split Details */}
        {Array.isArray(splits) && splits.length > 0 && (
          <View style={styles.splitCard}>
            <View style={styles.splitHeader}>
              <Ionicons name="people-outline" size={20} color={COLORS.primary} />
              <Text style={styles.splitTitle}>Split Between</Text>
            </View>

            {splits.map((split, index) => {
              const isCurrentUser = split.user_id === user?.id;
              return (
                <View key={split.id || index} style={styles.splitRow}>
                  <View style={styles.splitLeft}>
                    <View style={styles.userIcon}>
                      <Ionicons
                        name={isCurrentUser ? "person" : "person-outline"}
                        size={20}
                        color={isCurrentUser ? COLORS.primary : COLORS.textLight}
                      />
                    </View>
                    <Text style={[styles.splitName, isCurrentUser && styles.splitNameHighlight]}>
                      {isCurrentUser ? "You" : (split.user_name || split.user_id)}
                    </Text>
                  </View>
                  <Text style={[styles.splitAmount, isCurrentUser && styles.splitAmountHighlight]}>
                    {currencySymbol}
                    {parseFloat(split.amount_owed).toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Your Share Summary */}
        {Array.isArray(splits) && splits.find((s) => s.user_id === user?.id) && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Your Share</Text>
            <View style={styles.summaryContent}>
              {paidByYou ? (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>You paid</Text>
                    <Text style={styles.summaryValue}>
                      {currencySymbol}
                      {parseFloat(expense?.amount || 0).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Your share</Text>
                    <Text style={styles.summaryValue}>
                      -{currencySymbol}
                      {parseFloat(
                        splits.find((s) => s.user_id === user?.id)?.amount_owed || 0
                      ).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabelBold}>Others owe you</Text>
                    <Text style={styles.summaryValuePositive}>
                      +{currencySymbol}
                      {(
                        parseFloat(expense?.amount || 0) -
                        parseFloat(splits.find((s) => s.user_id === user?.id)?.amount_owed || 0)
                      ).toFixed(2)}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      Paid by {expense?.paid_by_user_name || expense?.paid_by_user_id}
                    </Text>
                    <Text style={styles.summaryValue}>
                      {currencySymbol}
                      {parseFloat(expense?.amount || 0).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabelBold}>You owe</Text>
                    <Text style={styles.summaryValueNegative}>
                      {currencySymbol}
                      {parseFloat(
                        splits.find((s) => s.user_id === user?.id)?.amount_owed || 0
                      ).toFixed(2)}
                    </Text>
                  </View>
                </>
              )}
            </View>
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
  editButton: {
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
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  amount: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
    textTransform: "capitalize",
  },
  date: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  paidByCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paidByHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  paidByTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textLight,
  },
  paidByName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  splitCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  splitHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  splitTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textLight,
  },
  splitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  splitLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  splitName: {
    fontSize: 14,
    color: COLORS.text,
  },
  splitNameHighlight: {
    fontWeight: "600",
  },
  splitAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  splitAmountHighlight: {
    color: COLORS.primary,
  },
  summaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
    opacity: 0.8,
    marginBottom: 12,
  },
  summaryContent: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
  },
  summaryLabelBold: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
    opacity: 0.9,
  },
  summaryValuePositive: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
  },
  summaryValueNegative: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.white,
    opacity: 0.2,
    marginVertical: 8,
  },
});
