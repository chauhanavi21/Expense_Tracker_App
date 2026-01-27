import { Slot, useRouter, useNavigationContainerRef } from "expo-router";
import SafeScreen from "@/components/SafeScreen";
import { ClerkProvider, useUser } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { registerForPushNotificationsAsync, setupNotificationListeners } from "../utils/notifications";

function NotificationHandler() {
  const { user } = useUser();
  const navigationRef = useNavigationContainerRef();
  const notificationListener = useRef();

  useEffect(() => {
    if (user?.id) {
      // Register for push notifications
      registerForPushNotificationsAsync(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    // Set up notification listeners
    const unsubscribe = setupNotificationListeners(navigationRef);
    return unsubscribe;
  }, [navigationRef]);

  return null;
}

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <SafeScreen>
        <NotificationHandler />
        <Slot />
      </SafeScreen>
      <StatusBar style="dark" />
    </ClerkProvider>
  );
}