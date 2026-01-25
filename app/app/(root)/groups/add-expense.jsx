import { useUser } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../constants/colors";
import { API_URL } from "../../../constants/api";

const CATEGORIES = [
  { id: "food", name: "Food & Drinks", icon: "fast-food" },
  { id: "shopping", name: "Shopping", icon: "cart" },
  { id: "transportation", name: "Transportation", icon: "car" },
  { id: "entertainment", name: "Entertainment", icon: "film" },
  { id: "bills", name: "Bills", icon: "receipt" },
  { id: "other", name: "Other", icon: "ellipsis-horizontal" },
];

export default function AddGroupExpenseScreen() {
  const { groupId } = useLocalSearchParams();
  const { user } = useUser();
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [splitType, setSplitType] = useState("equal"); // "equal" or "custom"
  const [customSplits, setCustomSplits] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [groupId]);

  const loadMembers = async () => {
    try {
      const response = await fetch(`${API_URL}/groups/${groupId}/members`);
      const data = await response.json();
      setMembers(data);
      // Auto-select current user
      setSelectedMembers([user.id]);
    } catch (error) {
      console.error("Error loading members:", error);
      Alert.alert("Error", "Failed to load group members");
    }
  };

  const toggleMember = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== userId));
      // Remove custom split if unselected
      const newCustomSplits = { ...customSplits };
      delete newCustomSplits[userId];
      setCustomSplits(newCustomSplits);
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const updateCustomSplit = (userId, value) => {
    setCustomSplits({
      ...customSplits,
      [userId]: value,
    });
  };

  const calculateEqualSplit = () => {
    if (!amount || selectedMembers.length === 0) return 0;
    return (parseFloat(amount) / selectedMembers.length).toFixed(2);
  };

  const calculateCustomTotal = () => {
    return Object.values(customSplits).reduce((sum, val) => {
      return sum + (parseFloat(val) || 0);
    }, 0);
  };

  const handleSubmit = async () => {
    // Validation
    if (!description.trim()) {
      Alert.alert("Error", "Please enter a description");
      return;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }
    if (!selectedCategory) {
      Alert.alert("Error", "Please select a category");
      return;
    }
    if (selectedMembers.length === 0) {
      Alert.alert("Error", "Please select at least one participant");
      return;
    }

    // Build splits array
    let splits = [];
    if (splitType === "equal") {
      const splitAmount = parseFloat(calculateEqualSplit());
      splits = selectedMembers.map((userId) => ({
        userId,
        amount: splitAmount,
      }));
    } else {
      // Custom splits
      const totalCustom = calculateCustomTotal();
      const totalAmount = parseFloat(amount);

      if (Math.abs(totalCustom - totalAmount) > 0.01) {
        Alert.alert(
          "Error",
          `Split amounts (${totalCustom.toFixed(2)}) must equal total amount (${totalAmount.toFixed(2)})`
        );
        return;
      }

      splits = selectedMembers.map((userId) => ({
        userId,
        amount: parseFloat(customSplits[userId] || 0),
      }));
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/groups/${groupId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: parseInt(groupId),
          description: description.trim(),
          amount: parseFloat(amount),
          paidBy: user.id,
          category: selectedCategory,
          splits,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Expense added successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to add expense");
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      Alert.alert("Error", "Failed to add expense");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Expense</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Dinner, Groceries"
          placeholderTextColor={COLORS.textLight}
          value={description}
          onChangeText={setDescription}
        />

        {/* Amount */}
        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor={COLORS.textLight}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipSelected,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons
                name={category.icon}
                size={18}
                color={selectedCategory === category.id ? COLORS.white : COLORS.primary}
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextSelected,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Participants */}
        <Text style={styles.label}>Who participated?</Text>
        {members.map((member) => (
          <TouchableOpacity
            key={member.user_id}
            style={styles.memberRow}
            onPress={() => toggleMember(member.user_id)}
          >
            <View style={styles.memberLeft}>
              <View
                style={[
                  styles.checkbox,
                  selectedMembers.includes(member.user_id) && styles.checkboxSelected,
                ]}
              >
                {selectedMembers.includes(member.user_id) && (
                  <Ionicons name="checkmark" size={16} color={COLORS.white} />
                )}
              </View>
              <Text style={styles.memberName}>
                {member.user_id === user.id ? "You" : member.user_id}
              </Text>
            </View>
            {splitType === "custom" && selectedMembers.includes(member.user_id) && (
              <TextInput
                style={styles.customSplitInput}
                placeholder="0.00"
                placeholderTextColor={COLORS.textLight}
                value={customSplits[member.user_id] || ""}
                onChangeText={(val) => updateCustomSplit(member.user_id, val)}
                keyboardType="decimal-pad"
              />
            )}
            {splitType === "equal" && selectedMembers.includes(member.user_id) && (
              <Text style={styles.splitAmount}>${calculateEqualSplit()}</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* Split Type Toggle */}
        <View style={styles.splitTypeContainer}>
          <Text style={styles.label}>Split Type</Text>
          <View style={styles.splitTypeButtons}>
            <TouchableOpacity
              style={[styles.splitTypeButton, splitType === "equal" && styles.splitTypeButtonActive]}
              onPress={() => setSplitType("equal")}
            >
              <Text
                style={[
                  styles.splitTypeButtonText,
                  splitType === "equal" && styles.splitTypeButtonTextActive,
                ]}
              >
                Equal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.splitTypeButton, splitType === "custom" && styles.splitTypeButtonActive]}
              onPress={() => setSplitType("custom")}
            >
              <Text
                style={[
                  styles.splitTypeButtonText,
                  splitType === "custom" && styles.splitTypeButtonTextActive,
                ]}
              >
                Custom
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Custom Split Summary */}
        {splitType === "custom" && selectedMembers.length > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Amount:</Text>
              <Text style={styles.summaryValue}>${amount || "0.00"}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Split Total:</Text>
              <Text
                style={[
                  styles.summaryValue,
                  Math.abs(calculateCustomTotal() - parseFloat(amount || 0)) > 0.01 &&
                    styles.summaryError,
                ]}
              >
                ${calculateCustomTotal().toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? "Adding..." : "Add Expense"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  },
  scrollContent: {
    paddingBottom: 100,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
  },
  categoryTextSelected: {
    color: COLORS.white,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  memberLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  splitAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  customSplitInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: COLORS.text,
    width: 80,
    textAlign: "right",
  },
  splitTypeContainer: {
    marginTop: 16,
  },
  splitTypeButtons: {
    flexDirection: "row",
    gap: 8,
  },
  splitTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  splitTypeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  splitTypeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  splitTypeButtonTextActive: {
    color: COLORS.white,
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  summaryError: {
    color: COLORS.expense,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
