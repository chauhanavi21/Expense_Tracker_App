import { useUser } from "@clerk/clerk-expo";
import { useRouter, useFocusEffect } from "expo-router";
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PieChart } from "react-native-chart-kit";
import { COLORS } from "../../constants/colors";
import { API_URL } from "../../constants/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 40;

const CATEGORY_ICONS = {
  food: "fast-food",
  shopping: "cart",
  transportation: "car",
  entertainment: "film",
  bills: "receipt",
  other: "ellipsis-horizontal",
};

const CATEGORY_COLORS = [
  COLORS.primary,
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
];

export default function ChartsScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [mode, setMode] = useState("personal"); // personal | group
  const [timeframe, setTimeframe] = useState("month"); // day | week | month
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Personal mode data
  const [personalTransactions, setPersonalTransactions] = useState([]);

  // Group mode data
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupExpenses, setGroupExpenses] = useState([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // Debounce timer ref
  const debounceTimer = useRef(null);

  // Load data on mount and when switching modes
  useFocusEffect(
    useCallback(() => {
      loadDataDebounced();
    }, [mode, selectedGroupId, user?.id])
  );

  const loadDataDebounced = useCallback(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0.3,
      duration: 150,
      useNativeDriver: true,
    }).start();

    // Debounce the actual load
    debounceTimer.current = setTimeout(() => {
      loadData();
    }, 200);
  }, [mode, selectedGroupId, user?.id]);

  const loadData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      if (mode === "personal") {
        await loadPersonalData();
      } else {
        await loadGroupData();
      }
    } catch (err) {
      console.error("Error loading charts data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setIsLoading(false);
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const loadPersonalData = async () => {
    try {
      const response = await fetch(`${API_URL}/transactions/${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch transactions");
      const data = await response.json();
      // Filter expenses: either type === "expense" OR negative amount (expense is negative in our app)
      const expenses = Array.isArray(data) 
        ? data.filter((t) => {
            if (t.type === "expense") return true;
            // If no type field, check if amount is negative (expense)
            const amount = parseFloat(t.amount || 0);
            return amount < 0;
          })
        : [];
      setPersonalTransactions(expenses);
    } catch (err) {
      console.error("Error loading personal data:", err);
      throw err;
    }
  };

  const loadGroupData = async () => {
    try {
      // Load user's groups
      const groupsRes = await fetch(`${API_URL}/groups/user/${user.id}`);
      if (!groupsRes.ok) throw new Error("Failed to fetch groups");
      const groupsData = await groupsRes.json();
      const groupsList = Array.isArray(groupsData) ? groupsData : [];
      setGroups(groupsList);

      // Select first group if none selected
      if (!selectedGroupId && groupsList.length > 0) {
        setSelectedGroupId(groupsList[0].id);
      }

      // Load expenses for selected group
      if (selectedGroupId || groupsList.length > 0) {
        const groupId = selectedGroupId || groupsList[0].id;
        const expensesRes = await fetch(`${API_URL}/groups/${groupId}/expenses`);
        if (!expensesRes.ok) throw new Error("Failed to fetch group expenses");
        const expensesData = await expensesRes.json();
        setGroupExpenses(Array.isArray(expensesData) ? expensesData : []);
      }
    } catch (err) {
      console.error("Error loading group data:", err);
      throw err;
    }
  };

  // Process data for charts
  const chartData = useMemo(() => {
    const rawData = mode === "personal" ? personalTransactions : groupExpenses;
    return processChartData(rawData, timeframe);
  }, [mode, personalTransactions, groupExpenses, timeframe]);

  const handleRetry = () => {
    loadData();
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView style={styles.contentWithPadding} showsVerticalScrollIndicator={false}>
        {/* Mode Selector */}
        <SegmentedControl
          options={["Personal", "Group"]}
          selectedIndex={mode === "personal" ? 0 : 1}
          onChange={(index) => setMode(index === 0 ? "personal" : "group")}
        />

        {/* Timeframe Selector */}
        <SegmentedControl
          options={["Day", "Week", "Month"]}
          selectedIndex={
            timeframe === "day" ? 0 : timeframe === "week" ? 1 : 2
          }
          onChange={(index) =>
            setTimeframe(index === 0 ? "day" : index === 1 ? "week" : "month")
          }
          style={{ marginTop: 12 }}
        />

        {/* Group Selector (only in group mode) */}
        {mode === "group" && groups.length > 0 && (
          <GroupSelector
            groups={groups}
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
          />
        )}

        {/* Loading State */}
        {isLoading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading data...</Text>
          </View>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle" size={64} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* No Groups State */}
        {!isLoading && !error && mode === "group" && groups.length === 0 && (
          <View style={styles.centerContainer}>
            <Ionicons name="people-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>No Groups Yet</Text>
            <Text style={styles.emptyText}>
              Create or join a group to view group expenses
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push("/groups")}
            >
              <Text style={styles.primaryButtonText}>Go to Groups</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Charts Content */}
        {!isLoading && !error && (mode === "personal" || groups.length > 0) && (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Category Distribution */}
            {chartData.categoryData.length > 0 ? (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Expenses by Category</Text>
                <CategoryDonutChart data={chartData.categoryData} />
                <CategoryLegend data={chartData.categoryData} />
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons
                  name="pie-chart-outline"
                  size={48}
                  color={COLORS.textLight}
                />
                <Text style={styles.emptyCardText}>
                  No expense data for this period
                </Text>
                <Text style={styles.emptyCardSubtext}>
                  {mode === "personal" 
                    ? "Add some personal expenses to see charts"
                    : "Add expenses to this group to see charts"}
                </Text>
              </View>
            )}

            {/* Time Series */}
            {chartData.timeSeriesData.length > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>
                  Expenses Over Time ({capitalize(timeframe)})
                </Text>
                <TimeBarChart
                  data={chartData.timeSeriesData}
                  timeframe={timeframe}
                />
              </View>
            )}

            {/* Summary Stats */}
            {chartData.categoryData.length > 0 && (
              <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>Summary</Text>
                <View style={styles.statsRow}>
                  <Text style={styles.statsLabel}>Total Expenses</Text>
                  <Text style={styles.statsValue}>
                    ${chartData.total.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.statsRow}>
                  <Text style={styles.statsLabel}>Average</Text>
                  <Text style={styles.statsValue}>
                    ${chartData.average.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.statsRow}>
                  <Text style={styles.statsLabel}>Count</Text>
                  <Text style={styles.statsValue}>{chartData.count}</Text>
                </View>
              </View>
            )}
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// Segmented Control Component
function SegmentedControl({ options, selectedIndex, onChange, style }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = (index) => {
    if (index !== selectedIndex) {
      // Animate scale
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      onChange(index);
    }
  };

  return (
    <View style={[styles.segmentedControl, style]}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.segmentButton,
            selectedIndex === index && styles.segmentButtonActive,
          ]}
          onPress={() => handlePress(index)}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale: selectedIndex === index ? scaleAnim : 1 }] }}>
            <Text
              style={[
                styles.segmentText,
                selectedIndex === index && styles.segmentTextActive,
              ]}
            >
              {option}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Group Selector Component
function GroupSelector({ groups, selectedGroupId, onSelectGroup }) {
  return (
    <View style={styles.groupSelector}>
      <Text style={styles.groupSelectorLabel}>Select Group</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.groupChipContainer}
      >
        {groups.map((group) => (
          <TouchableOpacity
            key={group.id}
            style={[
              styles.groupChip,
              selectedGroupId === group.id && styles.groupChipActive,
            ]}
            onPress={() => onSelectGroup(group.id)}
          >
            <Text
              style={[
                styles.groupChipText,
                selectedGroupId === group.id && styles.groupChipTextActive,
              ]}
            >
              {group.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// Category Donut Chart Component (Pure component for performance)
const CategoryDonutChart = React.memo(({ data }) => {
  const chartData = useMemo(() => 
    data.map((item, index) => ({
      name: item.category,
      amount: item.total,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      legendFontColor: COLORS.text,
      legendFontSize: 12,
    })),
    [data]
  );

  return (
    <PieChart
      data={chartData}
      width={CHART_WIDTH}
      height={220}
      chartConfig={{
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      }}
      accessor="amount"
      backgroundColor="transparent"
      paddingLeft="15"
      absolute
      hasLegend={false}
    />
  );
});

// Category Legend Component
function CategoryLegend({ data }) {
  return (
    <View style={styles.legend}>
      {data.map((item, index) => (
        <View key={item.category} style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] },
            ]}
          />
          <View style={styles.legendTextContainer}>
            <Text style={styles.legendCategory}>{capitalize(item.category)}</Text>
            <Text style={styles.legendAmount}>${item.total.toFixed(2)}</Text>
          </View>
          <Text style={styles.legendPercentage}>{item.percentage.toFixed(0)}%</Text>
        </View>
      ))}
    </View>
  );
}

// Time Bar Chart Component (Simple bars without library) - Pure component
const TimeBarChart = React.memo(({ data, timeframe }) => {
  const maxValue = useMemo(() => Math.max(...data.map((d) => d.total), 1), [data]);

  return (
    <View style={styles.barChart}>
      {data.map((item, index) => (
        <View key={item.label} style={styles.barContainer}>
          <View style={styles.barColumn}>
            <View
              style={[
                styles.bar,
                {
                  height: (item.total / maxValue) * 150,
                  backgroundColor: COLORS.primary,
                },
              ]}
            >
              <Text style={styles.barValue}>${item.total.toFixed(0)}</Text>
            </View>
          </View>
          <Text style={styles.barLabel} numberOfLines={1}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
});

// Data processing function (optimized for performance)
function processChartData(rawData, timeframe) {
  if (!rawData || rawData.length === 0) {
    return {
      categoryData: [],
      timeSeriesData: [],
      total: 0,
      average: 0,
      count: 0,
    };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0); // Start of today
  
  // Pre-calculate timeframe boundaries
  let startDate;
  if (timeframe === "day") {
    startDate = now;
  } else if (timeframe === "week") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Single pass through data for filtering and aggregation (O(n) instead of multiple passes)
  const categoryMap = {};
  const timeMap = {};
  let count = 0;

  rawData.forEach((item) => {
    const itemDate = new Date(item.created_at);
    itemDate.setHours(0, 0, 0, 0);
    
    // Filter by timeframe
    if (itemDate < startDate) return;
    
    count++;
    const amount = Math.abs(parseFloat(item.amount || 0));
    
    // Category aggregation
    const category = (item.category || "other").toLowerCase();
    categoryMap[category] = (categoryMap[category] || 0) + amount;
    
    // Time series aggregation
    let key;
    if (timeframe === "day") {
      key = itemDate.toLocaleDateString("en-US", { weekday: "short" });
    } else if (timeframe === "week") {
      key = itemDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else {
      const weekNum = getWeekNumber(itemDate);
      key = `Week ${weekNum}`;
    }
    timeMap[key] = (timeMap[key] || 0) + amount;
  });

  const total = Object.values(categoryMap).reduce((sum, val) => sum + val, 0);

  const categoryData = Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category: category,
      total: amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const timeSeriesData = Object.entries(timeMap)
    .map(([label, total]) => ({ label, total }))
    .slice(0, 10); // Limit to 10 bars

  return {
    categoryData,
    timeSeriesData,
    total,
    average: count > 0 ? total / count : 0,
    count,
  };
}

// Helper functions
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getWeekNumber(date) {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfMonth = date.getDate();
  return Math.ceil((dayOfMonth + firstDayOfMonth.getDay()) / 7);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentWithPadding: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 4,
    marginTop: 12,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: COLORS.primary,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textLight,
  },
  segmentTextActive: {
    color: COLORS.white,
  },
  groupSelector: {
    marginTop: 16,
  },
  groupSelectorLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  groupChipContainer: {
    flexDirection: "row",
  },
  groupChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  groupChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  groupChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  groupChipTextActive: {
    color: COLORS.white,
  },
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 16,
    alignSelf: 'flex-start',
    width: '100%',
  },
  legend: {
    marginTop: 16,
    width: '100%',
    alignSelf: 'flex-start',
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  legendTextContainer: {
    flex: 1,
  },
  legendCategory: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  legendAmount: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  legendPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: 200,
    paddingTop: 20,
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 4,
  },
  barColumn: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
  },
  bar: {
    width: "80%",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 4,
    minHeight: 40,
  },
  barValue: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.white,
  },
  barLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: "center",
  },
  statsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statsLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  statsValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.textLight,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.error,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  primaryButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 40,
    marginTop: 16,
    alignItems: "center",
  },
  emptyCardText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
  },
  emptyCardSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: "center",
  },
});
