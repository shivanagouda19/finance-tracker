# FinTrack — Personal Finance Tracker

A full-stack personal finance tracker with AI-powered insights, investment tracking, and smart budgeting tools.

🌐 **Live Demo:** [https://fin-track-delta-virid.vercel.app/](https://fin-track-delta-virid.vercel.app/)

---

## Tech Stack

- **Frontend:** React (Vite), React Router, Lucide Icons
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **AI:** Google Gemini 2.0 Flash
- **Investments:** Angel One SmartAPI
- **Email:** Brevo API
- **Deployment:** Vercel + Render

---

## Features

- 📊 Dashboard with spending overview and pie chart
- 💸 Expense & income tracking with categories
- 🤖 AI budget advisor (Gemini-powered insights)
- 🏦 Bank statement import via AI
- 📈 Angel One investment portfolio tracking
- 🎯 Savings goals with progress tracking
- 🔔 Upcoming payments with overdue alerts
- 📅 Calendar view for expenses and payments
- 🔐 JWT auth with email OTP verification
- 🌙 Dark / Light mode, fully mobile responsive

---

## Getting Started

### Backend
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
DBURL=your_mongodb_url
JWT_SECRET=your_secret
GEMINI_API_KEY=your_key
ANGEL_API_KEY=your_key
BREVO_API_KEY=your_key
EMAIL_USER=your_email
FRONTEND_URL=http://localhost:5173
```

```bash
node server.js
```

### Frontend
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
```

```bash
npm run dev
```

---

## Deployment

- Frontend deployed on **Vercel**
- Backend deployed on **Render**
