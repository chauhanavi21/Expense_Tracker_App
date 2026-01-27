# ETApp Mobile - Expense Tracker Mobile App

This is the mobile application for ETApp, built with [Expo](https://expo.dev) and React Native. It provides a beautiful, intuitive interface for personal expense tracking and group expense splitting.

## 📱 Features

### Personal Finance
- Track income and expenses with categories
- View real-time balance, income, and expense summaries
- Beautiful dashboard with color-coded insights
- Delete individual or bulk transactions

### Group Management
- Create groups with unique shareable codes
- Join groups using 6-character codes
- Add expenses on behalf of any group member
- Equal or custom split options
- Edit and delete expenses
- Real-time balance calculations
- Settle up with group members
- Leave groups with debt validation

### Profile & Settings
- Edit profile name with auto-sync across all groups
- View account information
- Member since date and email display

### Modern UI/UX
- Animated modals and transitions
- Beautiful bottom sheet selectors
- Multiple color themes (Coffee, Forest, Purple, Ocean)
- Smooth navigation with Expo Router
- Loading states and error handling
- Category-based expense organization

## 🚀 Get Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env` file in the `app/` directory:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
```

### 3. Update API URL

Edit `constants/api.js` to point to your backend:

```javascript
export const API_URL = "http://localhost:5001/api"; // Development
// export const API_URL = "https://your-api.com/api"; // Production
```

### 4. Start the app

```bash
npx expo start
```

In the output, you'll find options to open the app in:

- **Android emulator**: Press `a`
- **iOS simulator**: Press `i`
- **Expo Go**: Scan the QR code with your phone
- **Development build**: For full native features

## 📁 Project Structure

```
app/
├── app/                      # File-based routing (Expo Router)
│   ├── _layout.jsx          # Root layout with Clerk provider
│   ├── (auth)/              # Authentication screens
│   │   ├── sign-in.jsx     # Sign in screen
│   │   └── sign-up.jsx     # Sign up screen
│   ├── (root)/              # Main app screens (protected)
│   │   ├── index.jsx       # Home/Dashboard
│   │   ├── create.jsx      # Add personal transaction
│   │   ├── profile.jsx     # User profile
│   │   ├── menu.jsx        # Menu/settings
│   │   └── groups/         # Group management
│   │       ├── index.jsx           # Groups list
│   │       ├── [id].jsx            # Group detail
│   │       ├── create-group.jsx    # Create new group
│   │       ├── join-group.jsx      # Join via code
│   │       ├── share-group.jsx     # Share group code
│   │       ├── add-expense.jsx     # Add group expense
│   │       ├── edit-expense.jsx    # Edit expense
│   │       ├── expense-detail.jsx  # Expense details
│   │       └── balance-detail.jsx  # Balance breakdown
│   └── _layout.jsx          # Group layout
│
├── components/              # Reusable components
│   ├── BalanceCard.jsx     # Balance display card
│   ├── NoTransactionsFound.jsx
│   ├── PageLoader.jsx       # Loading spinner
│   ├── SafeScreen.jsx       # Safe area wrapper
│   ├── SignOutButton.jsx    # Sign out button
│   └── TransactionItem.jsx  # Transaction list item
│
├── constants/               # App constants
│   ├── api.js              # API URL configuration
│   └── colors.js           # Color themes
│
├── hooks/                   # Custom React hooks
│   └── useTransactions.js  # Transaction data hook
│
├── utils/                   # Utility functions
│   └── notifications.js    # Push notification setup
│
├── assets/                  # Static assets
│   ├── images/             # Icons, logos, images
│   └── styles/             # StyleSheet definitions
│
├── app.json                # Expo configuration
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript config
```

## 🎨 Customizing Themes

Edit `constants/colors.js` to change the app theme:

```javascript
// Available themes: coffee, forest, purple, ocean
export const COLORS = THEMES.ocean; // Change this line
```

Create custom themes:
```javascript
const myTheme = {
  primary: "#your-color",
  background: "#your-color",
  text: "#your-color",
  // ... more colors
};
```

## 🔧 Key Technologies

- **Expo SDK 54**: Cross-platform mobile framework
- **Expo Router**: File-based navigation
- **Clerk**: Authentication provider
- **React Native**: UI framework
- **Expo Notifications**: Push notifications
- **Ionicons**: Icon library

## 📱 Screen Flows

### Authentication Flow
1. Sign In / Sign Up screens (Clerk)
2. Redirect to Dashboard after successful auth

### Personal Expense Flow
1. Dashboard → Tap "+" button
2. Add Transaction screen
3. Fill details → Submit
4. View in dashboard

### Group Expense Flow
1. Groups List → Create/Join group
2. Group Detail → Add Expense
3. Select who paid (with animated modal)
4. Select participants
5. Choose split type (Equal/Custom)
6. Submit → View in group

### Profile Update Flow
1. Menu → Profile
2. Tap edit icon
3. Update name
4. Save → Auto-syncs across all groups

## 🎯 Component Examples

### Using the PageLoader
```jsx
import PageLoader from "../components/PageLoader";

function MyScreen() {
  const [loading, setLoading] = useState(true);
  
  if (loading) return <PageLoader />;
  
  return <View>...</View>;
}
```

### Using the BalanceCard
```jsx
import BalanceCard from "../components/BalanceCard";

<BalanceCard
  balance={1250.50}
  income={3000}
  expenses={1749.50}
/>
```

### Animated Modal Pattern
```jsx
import { Modal, Animated, Pressable } from 'react-native';

const [modalAnimation] = useState(new Animated.Value(0));

// Open modal
Animated.spring(modalAnimation, {
  toValue: 1,
  useNativeDriver: true,
}).start();

// Close modal
Animated.timing(modalAnimation, {
  toValue: 0,
  duration: 200,
  useNativeDriver: true,
}).start();
```

## 🔄 State Management

The app uses React Hooks for state management:

- `useState` - Local component state
- `useEffect` - Side effects and data fetching
- `useUser` - Clerk authentication state
- `useRouter` - Navigation
- `useLocalSearchParams` - Route parameters

## 🌐 API Integration

All API calls use `fetch` with the base URL from `constants/api.js`:

```javascript
import { API_URL } from "../constants/api";

const response = await fetch(`${API_URL}/groups/${groupId}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

const result = await response.json();
```

## 🔔 Push Notifications Setup

1. Register token on app launch:
```javascript
import { registerForPushNotificationsAsync } from "../utils/notifications";

const token = await registerForPushNotificationsAsync();
// Send token to backend
```

2. Backend sends notifications via Expo Push API

## 🧪 Development Tips

### Clear Cache
```bash
npx expo start -c
```

### Fix Dependencies
```bash
npx expo install --fix
```

### View Logs
```bash
# iOS simulator
npx expo logs --ios

# Android emulator
npx expo logs --android
```

### Build APK (Android)
```bash
eas build --platform android --profile preview
```

### Build IPA (iOS)
```bash
eas build --platform ios --profile preview
```

## 🐛 Common Issues

### Metro Bundler Errors
```bash
npx expo start --clear
rm -rf node_modules
npm install
```

### Clerk Authentication Issues
- Verify `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in `.env`
- Check Clerk dashboard for correct key
- Ensure development URLs are whitelisted in Clerk

### Navigation Issues
- Ensure all screens are in correct folder structure
- Check `_layout.jsx` files for proper configuration
- Verify import paths

### Style Not Applying
- Check `COLORS` import from `constants/colors.js`
- Verify StyleSheet is properly created
- Ensure styles are passed to component

## 📚 Learn More

### Expo Resources
- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [Expo API Reference](https://docs.expo.dev/versions/latest/)

### React Native Resources
- [React Native Docs](https://reactnative.dev/)
- [React Native Components](https://reactnative.dev/docs/components-and-apis)

### Authentication
- [Clerk Documentation](https://clerk.com/docs)
- [Clerk with Expo](https://clerk.com/docs/quickstarts/expo)

## 🎨 Design System

### Colors
Defined in `constants/colors.js` with theme support

### Typography
- Headers: 20-24px, fontWeight: "700"
- Body: 14-16px, fontWeight: "400-600"
- Captions: 12px, fontWeight: "400"

### Spacing
- Padding: 12px, 16px, 20px, 24px
- Margins: 8px, 12px, 16px, 24px
- Border Radius: 8px, 12px, 16px, 20px, 24px

### Shadows
```javascript
shadowColor: "#000",
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 4,
elevation: 3,
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test on iOS and Android
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

Built with ❤️ using Expo and React Native
