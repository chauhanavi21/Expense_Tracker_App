# ETApp - Expense Tracker & Group Split Manager

A full-stack mobile expense tracking application with advanced group splitting features, built with modern technologies.

## 🚀 Features

### Personal Expense Tracking
- ✅ Track income and expenses with categories
- ✅ View balance, income, and expense summaries
- ✅ Beautiful dashboard with visual insights
- ✅ Delete individual or all transactions

### Group Expense Management
- ✅ **Create and join groups** using unique 6-character codes
- ✅ **Share group codes** with friends
- ✅ **Add expenses on behalf of friends** - flexible "Paid By" selector with animated modal
- ✅ **Smart split options**: Equal or custom split amounts
- ✅ **Edit expenses** - modify description, amount, category, and splits
- ✅ **Delete expenses** - remove expenses with confirmation dialog
- ✅ **Balance tracking** - see who owes whom
- ✅ **Settle up** - mark debts as paid between members
- ✅ **Leave groups** - with automatic debt validation

### User Profile & Settings
- ✅ **Edit profile name** - updates automatically across all groups and expenses
- ✅ **Real-time sync** - name changes reflect everywhere instantly
- ✅ View member since date and email

### Push Notifications
- ✅ Real-time notifications for:
  - New members joining groups
  - Expense additions and updates
  - Expense deletions
  - Member leaving groups
  - Settlement confirmations

### Modern UI/UX
- ✅ Beautiful, clean design with multiple themes (Coffee, Forest, Purple, Ocean)
- ✅ Smooth animations and transitions
- ✅ Animated bottom sheet modals
- ✅ Intuitive navigation with Expo Router
- ✅ Loading states and error handling
- ✅ Category-based expense organization

## 🛠️ Tech Stack

### Mobile App (`/app`)
- **Framework**: Expo (SDK 54) + React Native
- **Navigation**: Expo Router (file-based routing)
- **Authentication**: Firebase Auth
- **UI**: React Native components with custom styling
- **State Management**: React Hooks
- **Notifications**: Expo Notifications

### Backend API (`/backend`)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Firestore (via Firebase Admin SDK)
- **Rate Limiting**: Upstash Redis
- **Cron Jobs**: node-cron (keep-alive ping)
- **Real-time**: Push notifications via Expo

## 📁 Project Structure

```
ETApp/
├── app/                    # Expo mobile application
│   ├── app/               # App screens (file-based routing)
│   │   ├── (auth)/       # Authentication screens
│   │   ├── (root)/       # Main app screens
│   │   │   └── groups/   # Group management screens
│   │   └── _layout.jsx   # Root layout
│   ├── components/        # Reusable components
│   ├── constants/         # Colors, API URLs, etc.
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   └── assets/           # Images, fonts, etc.
│
└── backend/               # Express API server
    └── src/
        ├── config/       # Database, Redis, Cron config
        ├── controllers/  # Route handlers
        │   ├── groupsController.js
        │   ├── transactionsController.js
        │   ├── notificationsController.js
        │   └── usersController.js
        ├── middleware/   # Rate limiting
        ├── routes/       # API routes
        └── utils/        # Push notifications
```

## 🔧 Prerequisites

- **Node.js**: 20.19.x or newer (required for Expo SDK 54)
- **npm**: Comes with Node.js
- **Expo CLI**: Installed globally or via npx
- **Firebase Project**: Firestore + Firebase Auth enabled
- **Redis**: Upstash for rate limiting

## 📦 Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd ETApp
```

### 2. Install backend dependencies
```bash
cd backend
npm install
```

### 3. Install app dependencies
```bash
cd app
npm install
```

## 🔐 Environment Variables

### Mobile App (`app/.env`)
```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

### Backend (`backend/.env`)
```env
# Firebase Admin
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}

UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
API_URL=https://your-api-url.com/api/health
PORT=5001
NODE_ENV=development
```

> **Note**: `.env` files are git-ignored for security. Never commit sensitive credentials.

## 🚀 Running the Application

### Development Mode

#### Start the Backend API
```bash
cd backend
npm run dev
```
Server runs on `http://localhost:5001`

#### Start the Mobile App
```bash
cd app
npx expo start
```

Then choose:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app for physical device

## 📡 API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Transactions
- `GET /api/transactions/:userId` - Get user's transactions
- `GET /api/transactions/summary/:userId` - Get income/expense summary
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update an existing transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `DELETE /api/transactions/user/:userId` - Delete all user transactions

#### Transactions API Notes
- `amount` must be a non-zero number (positive = income, negative = expense).
- `date` is optional on create/update; when omitted on create, server timestamp is used.
- `date` cannot be invalid or in the future.
- Summary values are stored and computed in cents (`balanceCents`, `incomeCents`, `expensesCents`) for precision.

### Groups
- `POST /api/groups` - Create new group
- `POST /api/groups/join` - Join group via code
- `POST /api/groups/leave` - Leave group
- `GET /api/groups/user/:userId` - Get user's groups
- `GET /api/groups/:groupId` - Get group details
- `GET /api/groups/:groupId/members` - Get group members

### Expenses
- `POST /api/groups/:groupId/expenses` - Add expense to group
- `PUT /api/groups/expenses/:expenseId` - Update expense
- `DELETE /api/groups/expenses/:expenseId` - Delete expense
- `GET /api/groups/:groupId/expenses` - Get group expenses
- `GET /api/groups/expenses/:expenseId/splits` - Get expense splits

### Balance & Settlement
- `GET /api/groups/:groupId/balance/:userId` - Get user's balance in group
- `POST /api/groups/settle` - Settle up between users

### Notifications
- `POST /api/notifications/register` - Register push token
- `POST /api/notifications/unregister` - Unregister push token

### User Profile
- `PUT /api/users/profile` - Update user name across all groups
- `GET /api/users/profile/:userId` - Get user profile info

## 🎨 Themes

The app supports multiple color themes (configurable in `app/constants/colors.js`):
- **Coffee** (warm browns) 🤎
- **Forest** (greens) 💚
- **Purple** (purples) 💜
- **Ocean** (blues) 💙 *(default)*

## 🔥 Key Features Explained

### 1. Add Expenses on Behalf of Friends
When a friend pays but asks you to log it:
1. Tap "Add Expense" in any group
2. Tap the "Paid By" selector at the top
3. Beautiful modal slides up showing all group members
4. Select your friend who actually paid
5. Fill in expense details normally
6. Expense is recorded as paid by your friend

### 2. Automatic Username Updates
Change your name once, see it update everywhere:
1. Go to Profile screen
2. Tap the pencil icon next to your name
3. Edit and save
4. Name updates automatically in:
   - All group memberships
   - All past expenses
   - All balance calculations
   - All notifications

### 3. Smart Expense Splitting
- **Equal Split**: Automatically divides expense equally
- **Custom Split**: Manually enter amounts (validates totals match)
- Real-time calculation display
- Visual feedback for incorrect splits

### 4. Delete Expenses
Only the person who paid can delete:
1. Open expense detail
2. Scroll to bottom
3. Tap "Delete Expense" (red button)
4. Confirm deletion
5. All group members are notified

## 🐛 Troubleshooting

### Expo SDK Version Mismatch
```bash
cd app
npx expo install --fix
npx expo start -c
```

### Metro Bundler Issues
```bash
cd app
npx expo start --clear
```

### Database Connection Issues
- Verify `FIREBASE_SERVICE_ACCOUNT_JSON` (or `GOOGLE_APPLICATION_CREDENTIALS`) is set for the backend
- Ensure Firestore is enabled in your Firebase project
- If deployed, confirm the host has access to Google credentials

### Rate Limiting Errors
- Verify Upstash Redis credentials
- Check `backend/src/middleware/rateLimiter.js`
- Temporarily disable for local development (not recommended)

### Push Notifications Not Working
- Ensure device/emulator supports notifications
- Check notification permissions in device settings
- Verify push token registration in database

## 📱 Device Compatibility

- **iOS**: 13.0 or later
- **Android**: API level 21 (Android 5.0) or later
- **Tested on**: iPhone 12+, Pixel 5+, various Android devices

## 🔒 Security Features

- ✅ Firebase Auth ID token authentication
- ✅ Rate limiting on all API endpoints
- ✅ Firestore access via Firebase Admin SDK
- ✅ Authorization checks (users can only modify their own data)
- ✅ Environment variable protection
- ✅ HTTPS in production

## 🚢 Deployment

### Backend
- Recommended: Render, Railway, or Heroku
- Set all environment variables
- Set `NODE_ENV=production`
- Database: Firestore (Firebase)

### Mobile App
- Build with EAS (Expo Application Services)
- Submit to App Store / Google Play
- Configure app.json with proper bundle identifiers

## 📄 Data Model

Firestore collections (high level):
- `users/{uid}` + `users/{uid}/transactions/*`
- `groups/{groupId}` + subcollections `members/*`, `expenses/*`, `splits/*`
- `groupCodes/{code}` (join-code mapping)
- `userTokens/{uid}` (Expo push token)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

Built with ❤️ by the ETApp team

## 🙏 Acknowledgments

- Expo team for the amazing framework
- Firebase for authentication and Firestore
- Upstash for Redis rate limiting
- React Native community

