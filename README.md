# 🎭 AnonChat - Anonymous Real-time Chatroom

A full-stack anonymous real-time chatroom application where millions can chat together while maintaining complete anonymity. Features AI-powered content moderation, admin management, and beautiful modern UI with 3D effects.

![Tech Stack](https://img.shields.io/badge/React-Vite-blue) ![Backend](https://img.shields.io/badge/Node.js-Express-green) ![Database](https://img.shields.io/badge/MongoDB-Mongoose-darkgreen) ![Real-time](https://img.shields.io/badge/Socket.IO-WebSocket-orange)

## ✨ Features

### 🔐 Authentication System
- **Registration** with Full Name, Email, Password, Confirm Password
- **OTP Email Verification** (6-digit code, 10-min expiry)
- **Secure Login** with JWT tokens
- **Permanent Anonymous Name** generated on signup (e.g., "MysticPhoenix4523")

### 💬 Real-time Chat
- **Global Chatroom** using WebSocket (Socket.IO)
- **Instant Messaging** with zero latency
- **Typing Indicators** (shows who's typing)
- **Online User Count** in real-time
- **Message History** (last 50 messages on join)
- **Anonymous Names** displayed instead of real identity

### 🛡️ AI Content Moderation
- **Groq AI** (LLaMA 3.3 70B) for nuanced content analysis
- **Fallback Word Filter** when AI is unavailable
- **Warning System**: 5 warnings → 6th warning blocks typing
- Messages with inappropriate content are silently blocked
- User gets warning notification with count

### 👑 Admin Panel
- **Fixed Admin Account**: `admin@gmail.com` / `Admin@0426`
- **Dashboard** with real-time statistics
- **User Management**:
  - View all users with search & filter
  - Block users for 24 hours
  - Block users permanently
  - Delete user accounts
  - Reset warning counts
  - Unblock users
- **Email Notifications** sent for every admin action

### 🎨 UI/UX
- Modern dark theme with glassmorphism
- 3D particle background (Three.js)
- Smooth animations (Framer Motion)
- Responsive design (mobile-friendly)
- Custom styled toast notifications

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, React Router |
| 3D Effects | Three.js, React Three Fiber |
| Animations | Framer Motion |
| Styling | Vanilla CSS (Custom Design System) |
| Backend | Node.js, Express 5 |
| Real-time | Socket.IO 4 |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| AI Moderation | Groq SDK (LLaMA 3.3 70B) |
| Email | Nodemailer (SMTP) |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (running locally or MongoDB Atlas)
- Gmail account for SMTP (or any SMTP provider)
- Groq API Key (optional, falls back to word filter)

### Installation

1. **Clone the repository**
```bash
cd AnonChat
```

2. **Setup Backend**
```bash
cd server
npm install
```

3. **Configure Environment Variables**
Edit `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/anonchat
JWT_SECRET=your_strong_secret_key
JWT_EXPIRES_IN=7d

# Gmail SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Groq AI (optional)
GROQ_API_KEY=your_groq_api_key

# Admin
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=Admin@0426

CLIENT_URL=http://localhost:5173
```

> **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App Passwords → Generate

4. **Setup Frontend**
```bash
cd ../client
npm install
```

5. **Run the Application**

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm run dev
```

6. **Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📁 Project Structure

```
AnonChat/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   └── Scene3D.jsx    # 3D particle background
│   │   ├── context/           # React contexts
│   │   │   └── AuthContext.jsx
│   │   ├── pages/             # Page components
│   │   │   ├── Landing.jsx    # Landing page
│   │   │   ├── Login.jsx      # Login page
│   │   │   ├── Register.jsx   # Registration + OTP
│   │   │   ├── Chat.jsx       # Chat room
│   │   │   └── Admin.jsx      # Admin dashboard
│   │   ├── services/          # API & Socket services
│   │   │   ├── api.js
│   │   │   └── socket.js
│   │   ├── App.jsx            # Root with routing
│   │   ├── index.css          # Design system
│   │   └── main.jsx           # Entry point
│   └── package.json
│
├── server/                    # Node.js Backend
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js  # Auth logic
│   │   └── adminController.js # Admin logic
│   ├── middleware/
│   │   └── auth.js            # JWT & admin guards
│   ├── models/
│   │   ├── User.js            # User model
│   │   └── Message.js         # Message model
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── adminRoutes.js
│   ├── socket/
│   │   └── chatSocket.js      # Socket.IO handler
│   ├── utils/
│   │   ├── email.js           # Email templates
│   │   ├── moderator.js       # AI moderation
│   │   └── nameGenerator.js   # Anonymous names
│   ├── .env                   # Environment vars
│   ├── index.js               # Server entry
│   └── package.json
│
└── README.md
```

## 🔑 Admin Access

Login with the fixed admin credentials:
- **Email**: `admingmail`
- **Password**: `AdminPass`

## 📧 Email Setup

For Gmail SMTP, you need to:
1. Enable 2-Step Verification on your Google account
2. Generate an App Password (Google Account → Security → App Passwords)
3. Use the generated password in `EMAIL_PASS`

## 🤖 Groq AI Setup

1. Get a free API key from [console.groq.com](https://console.groq.com)
2. Add it to your `.env` file as `GROQ_API_KEY`
3. The app will automatically use AI moderation when configured
4. Without Groq, it falls back to a built-in word filter

## 📄 License

MIT License - Feel free to use and modify!
