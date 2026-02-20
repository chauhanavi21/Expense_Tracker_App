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
  } from "react-native";
  import { useRouter } from "expo-router";
  import { useUser } from "@/context/auth";
  import { useState } from "react";
  import { apiFetch } from "@/lib/apiClient";
  import { styles } from "../../assets/styles/create.styles";
  import { COLORS } from "../../constants/colors";
  import { Ionicons } from "@expo/vector-icons";
  import DateTimePicker from "@react-native-community/datetimepicker";
  
  const CATEGORIES = [
    { id: "food", name: "Food & Drinks", icon: "fast-food" },
    { id: "shopping", name: "Shopping", icon: "cart" },
    { id: "transportation", name: "Transportation", icon: "car" },
    { id: "entertainment", name: "Entertainment", icon: "film" },
    { id: "bills", name: "Bills", icon: "receipt" },
    { id: "income", name: "Income", icon: "cash" },
    { id: "other", name: "Other", icon: "ellipsis-horizontal" },
  ];
  
  const CreateScreen = () => {
    const router = useRouter();
    const { user } = useUser();
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [isExpense, setIsExpense] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
  
    const handleCreate = async () => {
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
  
        const response = await apiFetch(`/transactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            title,
            amount: formattedAmount,
            category: selectedCategory,
            date: date.toISOString(),
          }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          console.log(errorData);
          throw new Error(errorData.error || "Failed to create transaction");
        }
  
        Alert.alert("Success", "Transaction created successfully");
        router.back();
      } catch (error) {
        Alert.alert("Error", error.message || "Failed to create transaction");
        console.error("Error creating transaction:", error);
      } finally {
        setIsLoading(false);
      }
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

    return (
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Transaction</Text>
          <TouchableOpacity
            style={[styles.saveButtonContainer, isLoading && styles.saveButtonDisabled]}
            onPress={handleCreate}
            disabled={isLoading}
          >
            <Text style={styles.saveButton}>{isLoading ? "Saving..." : "Save"}</Text>
            {!isLoading && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
          </TouchableOpacity>
        </View>
  
        <ScrollView 
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
        </View>
        </ScrollView>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}
      </KeyboardAvoidingView>
    );
  };
  export default CreateScreen;