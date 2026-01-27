import { useUser } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Share,
  Animated,
  Modal,
  Pressable,
  Switch,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../constants/colors";
import { API_URL } from "../../../constants/api";
import PageLoader from "../../../components/PageLoader";

export default function GroupSettingsScreen() {
  const { groupId } = useLocalSearchParams();
  const { user } = useUser();
  const router = useRouter();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSmartSplitModal, setShowSmartSplitModal] = useState(false);
  const [smartSplitResult, setSmartSplitResult] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));
  const [smartSplitEnabled, setSmartSplitEnabled] = useState(true);

  useEffect(() => {
    loadData();
  }, [groupId]);

  const loadData = async () => {
    try {
      // Load group details
      const groupRes = await fetch(`${API_URL}/groups/${groupId}`);
      const groupData = await groupRes.json();
      setGroup(groupData);
      setSmartSplitEnabled(groupData.smart_split_enabled !== false);

      // Load members
      const membersRes = await fetch(`${API_URL}/groups/${groupId}/members`);
      const membersData = await membersRes.json();
      setMembers(membersData);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load group data");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSmartSplitSetting = async (enabled) => {
    try {
      const response = await fetch(`${API_URL}/groups/smart-split/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: groupId,
          enabled: enabled,
        }),
      });

      if (response.ok) {
        setSmartSplitEnabled(enabled);
        Alert.alert(
          "Success",
          `Smart Split ${enabled ? "enabled" : "disabled"} for this group`
        );
      } else {
        Alert.alert("Error", "Failed to update Smart Split setting");
      }
    } catch (error) {
      console.error("Error toggling smart split:", error);
      Alert.alert("Error", "Failed to update setting");
    }
  };

  const shareGroup = async () => {
    try {
      const message = `Join my group "${group?.name}" on Expense Tracker!\n\nGroup Code: ${group?.code}\n\nOpen the app, go to Groups tab, and tap "Join Group" to enter this code.`;

      await Share.share({ message });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const copyCode = async () => {
    await Clipboard.setStringAsync(group?.code || "");
    Alert.alert("Copied!", "Group code copied to clipboard");
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      "Leave Group",
      "Are you sure you want to leave this group? If you have unsettled expenses, you'll need to settle them first.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/groups/leave`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  groupId: groupId,
                  userId: user.id,
                }),
              });

              const data = await response.json();

              if (!response.ok) {
                Alert.alert("Cannot Leave", data.message);
                return;
              }

              Alert.alert("Success", data.message, [
                {
                  text: "OK",
                  onPress: () => router.replace("/groups"),
                },
              ]);
            } catch (error) {
              console.error("Error leaving group:", error);
              Alert.alert("Error", "Failed to leave group");
            }
          },
        },
      ]
    );
  };

  // Smart Split Algorithm - Transitive Debt Elimination
  // Example: If Raj owes Me $10 and I owe Bob $15
  // Result: Raj pays Bob $10, I pay Bob $5 (eliminating me as middleman)
  const calculateSmartSplit = async () => {
    if (!smartSplitEnabled) {
      Alert.alert(
        "Smart Split Disabled",
        "Smart Split is currently disabled for this group. Enable it in settings to use this feature."
      );
      return;
    }

    setCalculating(true);
    try {
      // Get balance for each member
      const balances = {};
      const memberNames = {};

      for (const member of members) {
        memberNames[member.user_id] = member.user_name;
        const balanceRes = await fetch(
          `${API_URL}/groups/${groupId}/balance/${member.user_id}`
        );
        const balanceData = await balanceRes.json();
        balances[member.user_id] = balanceData.netBalance;
      }

      // Separate creditors (positive balance) and debtors (negative balance)
      const creditors = [];
      const debtors = [];

      Object.entries(balances).forEach(([userId, balance]) => {
        if (balance > 0.01) {
          creditors.push({ userId, amount: balance, name: memberNames[userId] });
        } else if (balance < -0.01) {
          debtors.push({
            userId,
            amount: Math.abs(balance),
            name: memberNames[userId],
          });
        }
      });

      // If no debts, everyone is settled
      if (creditors.length === 0 || debtors.length === 0) {
        setSmartSplitResult({
          transactions: [],
          totalTransactions: 0,
          savings: 0,
          simplified: true,
        });
        openSmartSplitModal();
        return;
      }

      // Optimized algorithm: Match debtors with creditors to minimize transactions
      const transactions = [];
      let creditorsCopy = [...creditors].sort((a, b) => b.amount - a.amount);
      let debtorsCopy = [...debtors].sort((a, b) => b.amount - a.amount);

      // Keep matching largest debtor with largest creditor
      while (creditorsCopy.length > 0 && debtorsCopy.length > 0) {
        const creditor = creditorsCopy[0];
        const debtor = debtorsCopy[0];

        const settleAmount = Math.min(creditor.amount, debtor.amount);

        transactions.push({
          from: debtor.name,
          fromId: debtor.userId,
          to: creditor.name,
          toId: creditor.userId,
          amount: settleAmount,
        });

        creditor.amount -= settleAmount;
        debtor.amount -= settleAmount;

        if (creditor.amount < 0.01) {
          creditorsCopy.shift();
        }
        if (debtor.amount < 0.01) {
          debtorsCopy.shift();
        }
      }

      // Calculate how many transactions were eliminated
      const naiveTransactionCount = Math.max(creditors.length, debtors.length);
      const optimizedCount = transactions.length;
      const savings = Math.max(0, naiveTransactionCount - optimizedCount);

      setSmartSplitResult({
        transactions,
        totalTransactions: transactions.length,
        savings,
        simplified: true,
      });

      openSmartSplitModal();
    } catch (error) {
      console.error("Error calculating smart split:", error);
      Alert.alert("Error", "Failed to calculate optimal settlement");
    } finally {
      setCalculating(false);
    }
  };

  const openSmartSplitModal = () => {
    setShowSmartSplitModal(true);
    Animated.spring(modalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const closeSmartSplitModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowSmartSplitModal(false);
    });
  };

  const handleSettleUp = (transaction) => {
    Alert.alert(
      "Settle Up",
      `Mark this payment as complete?\n\n${transaction.from} pays ${transaction.to} ${group?.currency === "USD" ? "$" : "₹"}${transaction.amount.toFixed(2)}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark as Paid",
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/groups/settle`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  groupId: groupId,
                  fromUserId: transaction.fromId,
                  toUserId: transaction.toId,
                }),
              });

              if (response.ok) {
                Alert.alert("Success", "Payment marked as complete!");
                closeSmartSplitModal();
                loadData(); // Refresh data
              } else {
                const data = await response.json();
                Alert.alert("Error", data.message || "Failed to settle up");
              }
            } catch (error) {
              console.error("Error settling up:", error);
              Alert.alert("Error", "Failed to complete settlement");
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
        <Text style={styles.headerTitle}>Group Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Group Info */}
        <View style={styles.groupInfoCard}>
          <View style={styles.groupIconContainer}>
            <Ionicons name="people" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.groupName}>{group?.name}</Text>
          <Text style={styles.groupCode}>Code: {group?.code}</Text>
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members ({members.length})</Text>
          {members.map((member, index) => {
            const isCurrentUser = member.user_id === user.id;
            return (
              <View
                key={member.user_id}
                style={[
                  styles.memberCard,
                  index === members.length - 1 && { marginBottom: 0 },
                ]}
              >
                <View style={styles.memberAvatar}>
                  <Ionicons
                    name={isCurrentUser ? "person" : "person-outline"}
                    size={24}
                    color={isCurrentUser ? COLORS.primary : COLORS.textLight}
                  />
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {isCurrentUser ? "You" : member.user_name}
                  </Text>
                  <Text style={styles.memberDate}>
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </Text>
                </View>
                {group?.created_by === member.user_id && (
                  <View style={styles.adminBadge}>
                    <Ionicons name="star" size={12} color={COLORS.white} />
                    <Text style={styles.adminText}>Admin</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Smart Split Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Smart Split</Text>
          <Text style={styles.sectionDescription}>
            Automatically simplify settlements by eliminating intermediate payments
          </Text>

          {/* Smart Split Toggle */}
          <View style={styles.toggleCard}>
            <View style={styles.toggleLeft}>
              <View style={styles.actionIconWrapper}>
                <Ionicons
                  name="swap-horizontal"
                  size={22}
                  color={smartSplitEnabled ? COLORS.primary : COLORS.textLight}
                />
              </View>
              <View style={styles.toggleContent}>
                <Text style={styles.actionTitle}>Enable Smart Split</Text>
                <Text style={styles.actionSubtitle}>
                  {smartSplitEnabled
                    ? "Optimizations active"
                    : "Direct settlements only"}
                </Text>
              </View>
            </View>
            <Switch
              value={smartSplitEnabled}
              onValueChange={toggleSmartSplitSetting}
              trackColor={{ false: COLORS.border, true: COLORS.primary + "50" }}
              thumbColor={smartSplitEnabled ? COLORS.primary : COLORS.textLight}
            />
          </View>

          {/* Calculate Smart Split */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              !smartSplitEnabled && styles.actionButtonDisabled,
            ]}
            onPress={calculateSmartSplit}
            disabled={calculating || !smartSplitEnabled}
          >
            <View style={styles.actionIconWrapper}>
              <Ionicons
                name="analytics"
                size={22}
                color={smartSplitEnabled ? COLORS.primary : COLORS.textLight}
              />
            </View>
            <View style={styles.actionContent}>
              <Text
                style={[
                  styles.actionTitle,
                  !smartSplitEnabled && styles.actionTitleDisabled,
                ]}
              >
                Calculate Optimal Settlement
              </Text>
              <Text style={styles.actionSubtitle}>
                {smartSplitEnabled
                  ? "View optimized payment plan"
                  : "Enable Smart Split first"}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={smartSplitEnabled ? COLORS.textLight : COLORS.border}
            />
          </TouchableOpacity>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Share & Invite</Text>

          {/* Share Group */}
          <TouchableOpacity style={styles.actionButton} onPress={shareGroup}>
            <View style={styles.actionIconWrapper}>
              <Ionicons name="share-social" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Share Group</Text>
              <Text style={styles.actionSubtitle}>
                Invite friends to join this group
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </TouchableOpacity>

          {/* Copy Code */}
          <TouchableOpacity style={styles.actionButton} onPress={copyCode}>
            <View style={styles.actionIconWrapper}>
              <Ionicons name="copy" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Copy Group Code</Text>
              <Text style={styles.actionSubtitle}>
                Copy {group?.code} to clipboard
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleLeaveGroup}
          >
            <View style={[styles.actionIconWrapper, styles.dangerIconWrapper]}>
              <Ionicons name="exit" size={22} color={COLORS.error} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.dangerTitle}>Leave Group</Text>
              <Text style={styles.actionSubtitle}>
                Remove yourself from this group
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Smart Split Modal */}
      <Modal
        visible={showSmartSplitModal}
        transparent
        animationType="none"
        onRequestClose={closeSmartSplitModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeSmartSplitModal}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  {
                    translateY: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
                opacity: modalAnimation,
              },
            ]}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalIconCircle}>
                <Ionicons name="analytics" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.modalTitle}>Smart Split Results</Text>
              <Text style={styles.modalSubtitle}>
                Optimal settlement plan to minimize transactions
              </Text>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {smartSplitResult && smartSplitResult.transactions.length === 0 ? (
                <View style={styles.allSettledCard}>
                  <Ionicons name="checkmark-circle" size={64} color={COLORS.income} />
                  <Text style={styles.allSettledTitle}>All Settled Up!</Text>
                  <Text style={styles.allSettledText}>
                    No pending settlements in this group
                  </Text>
                </View>
              ) : (
                <>
                  {/* Stats */}
                  <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                      <Text style={styles.statValue}>
                        {smartSplitResult?.totalTransactions || 0}
                      </Text>
                      <Text style={styles.statLabel}>Transactions</Text>
                    </View>
                    {smartSplitResult?.savings > 0 && (
                      <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: COLORS.income }]}>
                          {smartSplitResult.savings}
                        </Text>
                        <Text style={styles.statLabel}>Saved</Text>
                      </View>
                    )}
                  </View>

                  {/* Transactions */}
                  <Text style={styles.transactionsTitle}>Settlement Plan</Text>
                  {smartSplitResult?.transactions.map((transaction, index) => (
                    <View key={index} style={styles.transactionCard}>
                      <View style={styles.transactionHeader}>
                        <View style={styles.transactionFrom}>
                          <Ionicons
                            name="person"
                            size={20}
                            color={COLORS.expense}
                          />
                          <Text style={styles.transactionName}>
                            {transaction.from}
                          </Text>
                        </View>
                        <Ionicons
                          name="arrow-forward"
                          size={20}
                          color={COLORS.textLight}
                        />
                        <View style={styles.transactionTo}>
                          <Text style={styles.transactionName}>
                            {transaction.to}
                          </Text>
                          <Ionicons
                            name="person"
                            size={20}
                            color={COLORS.income}
                          />
                        </View>
                      </View>

                      <View style={styles.transactionAmount}>
                        <Text style={styles.transactionAmountText}>
                          {currencySymbol}
                          {transaction.amount.toFixed(2)}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.settleButton}
                        onPress={() => handleSettleUp(transaction)}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={COLORS.white}
                        />
                        <Text style={styles.settleButtonText}>Mark as Paid</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={closeSmartSplitModal}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>
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
  groupInfoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  groupIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  groupName: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  groupCode: {
    fontSize: 14,
    color: COLORS.textLight,
    letterSpacing: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 12,
    lineHeight: 18,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  memberDate: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.white,
  },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  toggleContent: {
    flex: 1,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  actionTitleDisabled: {
    color: COLORS.textLight,
  },
  actionSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error + "30",
  },
  dangerIconWrapper: {
    backgroundColor: COLORS.error + "15",
  },
  dangerTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.error,
    marginBottom: 2,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "center",
  },
  modalScroll: {
    maxHeight: 450,
  },
  allSettledCard: {
    alignItems: "center",
    paddingVertical: 40,
  },
  allSettledTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.income,
    marginTop: 16,
    marginBottom: 8,
  },
  allSettledText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  transactionsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  transactionCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  transactionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  transactionFrom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  transactionTo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "flex-end",
  },
  transactionName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  transactionAmount: {
    alignItems: "center",
    marginBottom: 12,
  },
  transactionAmountText: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.primary,
  },
  settleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.income,
    paddingVertical: 10,
    borderRadius: 8,
  },
  settleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },
  modalCloseButton: {
    backgroundColor: COLORS.background,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
});
