import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_URL } from '../constants/api';

// Check if we're running in Expo Go (SDK 53+ doesn't support push notifications in Expo Go)
const isExpoGo = Constants.appOwnership === 'expo';

// Configure notification behavior only if not in Expo Go
if (!isExpoGo) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (error) {
    console.log('Notification handler setup skipped (Expo Go limitation)');
  }
}

// Register for push notifications and get token
export async function registerForPushNotificationsAsync(userId) {
  // Skip in Expo Go (SDK 53+ limitation)
  if (isExpoGo) {
    console.log('Push notifications are not available in Expo Go. Use a development build for full functionality.');
    return null;
  }

  let token;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        return null;
      }
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId,
      })).data;
      
      console.log('Push token:', token);
      
      // Save token to backend
      if (token && userId) {
        try {
          await fetch(`${API_URL}/notifications/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, pushToken: token }),
          });
        } catch (error) {
          console.error('Error saving push token:', error);
        }
      }
    } else {
      console.log('Push notifications require a physical device');
    }
  } catch (error) {
    console.log('Error registering for push notifications:', error.message);
  }

  return token;
}

// Set up notification listeners
export function setupNotificationListeners(navigationRef) {
  // Skip in Expo Go
  if (isExpoGo) {
    console.log('Notification listeners not available in Expo Go');
    return () => {}; // Return empty cleanup function
  }

  try {
    // Handle notification when app is in foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
    });

    // Handle notification tap/press
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      const data = response.notification.request.content.data;
      
      // Navigate based on notification type
      if (data.type === 'expense_added' || data.type === 'expense_edited') {
        navigationRef?.navigate('groups', {
          screen: 'expense-detail',
          params: { expenseId: data.expenseId, groupId: data.groupId }
        });
      } else if (data.type === 'member_joined' || data.type === 'member_left') {
        navigationRef?.navigate('groups', {
          screen: '[id]',
          params: { id: data.groupId }
        });
      } else if (data.type === 'settled_up' || data.type === 'someone_owes') {
        navigationRef?.navigate('groups', {
          screen: 'balance-detail',
          params: { groupId: data.groupId }
        });
      }
    });

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  } catch (error) {
    console.log('Error setting up notification listeners:', error.message);
    return () => {}; // Return empty cleanup function
  }
}

// Schedule a local notification (for testing)
export async function scheduleTestNotification() {
  // Skip in Expo Go
  if (isExpoGo) {
    console.log('Local notifications not available in Expo Go');
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Notification",
        body: 'This is a test notification from your Expense Tracker app!',
        data: { test: true },
      },
      trigger: { seconds: 2 },
    });
  } catch (error) {
    console.log('Error scheduling test notification:', error.message);
  }
}
