import { SignedIn, SignedOut, useUser } from "@/context/auth";
import { Link, useRouter, useFocusEffect } from "expo-router";
import { Alert, FlatList, Image, RefreshControl, Text, TouchableOpacity, View, Platform, StatusBar } from "react-native";
import { SignOutButton } from "@/components/SignOutButton";
import { useTransactions } from "../../hooks/useTransactions";
import { useEffect, useState, useCallback } from "react";
import PageLoader from "../../components/PageLoader";
import { styles } from "../../assets/styles/home.styles";
import { Ionicons } from "@expo/vector-icons";
import { BalanceCard } from "../../components/BalanceCard";
import { TransactionItem } from "../../components/TransactionItem";
import NoTransactionsFound from "../../components/NoTransactionsFound";
import { TransactionDetailModal } from "../../components/TransactionDetailModal";

export default function Page() {
  const { user } = useUser();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const userId = user?.id;
  const { transactions, summary, isLoading, loadData, deleteTransaction } = useTransactions(userId);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [loadData, userId]);

  // Auto-refresh when screen comes into focus (after creating transaction)
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        loadData();
      }
    }, [userId, loadData])
  );

  const handleDelete = (id) => {
    Alert.alert("Delete Transaction", "Are you sure you want to delete this transaction?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTransaction(id) },
    ]);
  };

  const handleTransactionPress = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedTransaction(null);
  };

  const handleUpdateSuccess = async () => {
    await loadData();
  };

  if (isLoading && !refreshing) return <PageLoader />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        {/* HEADER */}
        <View style={styles.header}>
          {/* LEFT */}
          <View style={styles.headerLeft}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.headerLogo}
              contentFit="contain"
            />
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome,</Text>
              <Text style={styles.usernameText}>
                {user?.fullName ||
                  user?.firstName ||
                  user?.emailAddresses?.[0]?.emailAddress?.split("@")?.[0]}
              </Text>
            </View>
          </View>
          {/* RIGHT */}
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push("/create")}>
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={() => router.push("/menu")}>
              <Ionicons name="menu-outline" size={22} color="#111" />
            </TouchableOpacity>
          </View>
        </View>

        <BalanceCard summary={summary} />

        <View style={styles.transactionsHeaderContainer}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
        </View>
      </View>

      <FlatList
        style={styles.transactionsList}
        contentContainerStyle={styles.transactionsListContent}
        data={transactions}
        renderItem={({ item }) => (
          <TransactionItem 
            item={item} 
            onDelete={handleDelete}
            onPress={handleTransactionPress}
          />
        )}
        ListEmptyComponent={<NoTransactionsFound />}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      <TransactionDetailModal
        visible={showDetailModal}
        transaction={selectedTransaction}
        onClose={handleCloseModal}
        onUpdate={handleUpdateSuccess}
      />
    </View>
  );
}