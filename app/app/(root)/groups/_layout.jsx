import { Stack } from "expo-router";

export default function GroupsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create-group" />
      <Stack.Screen name="join-group" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="add-expense" />
      <Stack.Screen name="expense-detail" />
      <Stack.Screen name="balance-detail" />
    </Stack>
  );
}
