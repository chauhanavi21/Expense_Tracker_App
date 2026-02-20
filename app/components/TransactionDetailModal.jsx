import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Modal,
} from "react-native";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/apiClient";
import { COLORS } from "../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { StyleSheet } from "react-native";

const CATEGORIES = [
  { id: "food", name: "Food & Drinks", icon: "fast-food" },
  { id: "shopping", name: "Shopping", icon: "cart" },
  { id: "transportation", name: "Transportation", icon: "car" },
  { id: "entertainment", name: "Entertainment", icon: "film" },
  { id: "bills", name: "Bills", icon: "receipt" },
  { id: "income", name: "Income", icon: "cash" },
  { id: "other", name: "Other", icon: "ellipsis-horizontal" },
];

export const TransactionDetailModal = ({ visible, transaction, onClose, onUpdate }) => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isExpense, setIsExpense] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Reset state when transaction changes
  useEffect(() => {
    if (transaction) {
      setTitle(transaction.title || "");
      setAmount(Math.abs(parseFloat(transaction.amount || 0)).toString());
      setSelectedCategory(transaction.category || "");
      setIsExpense(parseFloat(transaction.amount || 0) < 0);
      setDate(transaction.created_at ? new Date(transaction.created_at) : new Date());
      setShowDatePicker(false);
    }
  }, [transaction]);

  const handleUpdate = async () => {
    if (!title.trim()) return Alert.alert("Error", "Please enter a transaction title");
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (!selectedCategory) return Alert.alert("Error", "Please select a category");

    setIsLoading(true);
    try {
      const formattedAmount = isExpense
        ? -Math.abs(parseFloat(amount))
        : Math.abs(parseFloat(amount));

      const response = await apiFetch(`/transactions/${transaction.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          amount: formattedAmount,
          category: selectedCategory,
          date: date.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update transaction");
      }

      Alert.alert("Success", "Transaction updated successfully");
      if (onUpdate) {
        await onUpdate();
      }
      onClose();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update transaction");
      console.error("Error updating transaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              const response = await apiFetch(`/transactions/${transaction.id}`, {
                method: "DELETE",
              });

              if (!response.ok) throw new Error("Failed to delete transaction");

              Alert.alert("Success", "Transaction deleted successfully");
              if (onUpdate) {
                await onUpdate();
              }
              onClose();
            } catch (error) {
              Alert.alert("Error", error.message || "Failed to delete transaction");
              console.error("Error deleting transaction:", error);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (event?.type === "dismissed") {
      return;
    }

    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatDisplayDate = (date) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  if (!transaction) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Details</Text>
          <TouchableOpacity
            style={styles.deleteIconButton}
            onPress={handleDelete}
            disabled={isLoading}
          >
            <Ionicons name="trash-outline" size={24} color={COLORS.expense} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View style={styles.card}>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, isExpense && styles.typeButtonActive]}
                onPress={() => setIsExpense(true)}
              >
                <Ionicons
                  name="arrow-down-circle"
                  size={22}
                  color={isExpense ? COLORS.white : COLORS.expense}
                  style={styles.typeIcon}
                />
                <Text style={[styles.typeButtonText, isExpense && styles.typeButtonTextActive]}>
                  Expense
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, !isExpense && styles.typeButtonActive]}
                onPress={() => setIsExpense(false)}
              >
                <Ionicons
                  name="arrow-up-circle"
                  size={22}
                  color={!isExpense ? COLORS.white : COLORS.income}
                  style={styles.typeIcon}
                />
                <Text style={[styles.typeButtonText, !isExpense && styles.typeButtonTextActive]}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={COLORS.textLight}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="create-outline"
                size={22}
                color={COLORS.textLight}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Transaction Title"
                placeholderTextColor={COLORS.textLight}
                value={title}
                onChangeText={setTitle}
                returnKeyType="done"
              />
            </View>

            <Text style={styles.sectionTitle}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.text} /> Date
            </Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker((prev) => !prev)}
            >
              <Ionicons name="calendar" size={22} color={COLORS.primary} style={styles.inputIcon} />
              <Text style={styles.datePickerText}>{formatDisplayDate(date)}</Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={onDateChange}
                maximumDate={new Date()}
                themeVariant="light"
                accentColor={COLORS.primary}
                textColor={COLORS.text}
              />
            )}

            <Text style={styles.sectionTitle}>
              <Ionicons name="pricetag-outline" size={16} color={COLORS.text} /> Category
            </Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.name && styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(category.name)}
                >
                  <Ionicons
                    name={category.icon}
                    size={20}
                    color={selectedCategory === category.name ? COLORS.white : COLORS.text}
                    style={styles.categoryIcon}
                  />
                  <Text
                    style={[
                      styles.categoryButtonText,
                      selectedCategory === category.name && styles.categoryButtonTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.updateButton, isLoading && styles.updateButtonDisabled]}
              onPress={handleUpdate}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
                  <Text style={styles.updateButtonText}>Update Transaction</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  backButton: {
    padding: 5,
  },
  deleteIconButton: {
    padding: 5,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.card,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typeSelector: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 10,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeIcon: {
    marginRight: 8,
  },
  typeButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "500",
  },
  typeButtonTextActive: {
    color: COLORS.white,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: 16,
    marginBottom: 20,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.text,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: "bold",
    color: COLORS.text,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    backgroundColor: COLORS.white,
  },
  inputIcon: {
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 8,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    backgroundColor: COLORS.white,
  },
  datePickerText: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "500",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryButtonText: {
    color: COLORS.text,
    fontSize: 14,
  },
  categoryButtonTextActive: {
    color: COLORS.white,
  },
  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
  },
  updateButtonDisabled: {
    opacity: 0.5,
  },
  updateButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
