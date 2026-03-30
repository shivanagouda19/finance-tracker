//sever.js
require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/User");
const app = express();
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const speakeasy = require('speakeasy');
const JWT_SECRET = process.env.JWT_SECRET || "SECRET_KEY";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(express.json());

// connect MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/expenses");

mongoose.connection.once("open", () => {
  console.log("MongoDB connected");
});

console.log('Using Model:', process.env.GEMINI_MODEL || "gemini-2.5-flash");

// schema
const ExpenseSchema = new mongoose.Schema({
  userId: String,
  title: String,
  amount: Number,
  category: { type: String, default: "Other" },
  createdAt: { type: Date, default: Date.now }
});

const Expense = mongoose.model("Expense", ExpenseSchema);

const IncomeSchema = new mongoose.Schema({
  userId: String,
  title: String,
  amount: Number,
  source: { type: String, default: "Other" },
  createdAt: { type: Date, default: Date.now }
});

const Income = mongoose.model("Income", IncomeSchema);

const SummarySchema = new mongoose.Schema({
  key: { type: String, unique: true },
  userId: String,
  totalReceived: { type: Number, default: 0 }
});

const Summary = mongoose.model("Summary", SummarySchema);

const UpcomingPaymentSchema = new mongoose.Schema({
  userId: String,
  name: String,
  amount: Number,
  dueDate: Date,
  type: { type: String, enum: ['Bill', 'Debt'], default: 'Bill' },
  status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const UpcomingPayment = mongoose.model('UpcomingPayment', UpcomingPaymentSchema);

const GoalSchema = new mongoose.Schema({
  userId: String,
  name: String,
  targetAmount: Number,
  savedAmount: { type: Number, default: 0 },
  category: { type: String, default: 'Other' },
  targetDate: { type: Date, default: null },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Goal = mongoose.model('Goal', GoalSchema);

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

async function generateGeminiText(prompt, generationConfig = {}) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY in backend .env");
    }

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      generationConfig: { responseMimeType: 'application/json' }
    });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = await result.response;
    return response.text() || "[]";
  } catch (error) {
    console.error("Gemini API error:", error?.message || error);
    throw error;
  }
}

// routes
app.post("/signup", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashed
    });

    await user.save();
    res.json({ message: "User created" });
  } catch {
    res.status(500).json({ error: "Could not create user" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }
    if (!password || password.trim() === "") {
      return res.status(400).json({ error: "Password is required" });
    }

    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(400).json({ error: "Wrong password" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, email: user.email });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/expenses", authMiddleware, async (req, res) => {
  const data = await Expense.find({ userId: req.userId });
  res.json(data);
});

app.post("/expenses", authMiddleware, async (req, res) => {
  const { title, amount, category } = req.body;
  
  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Description is required" });
  }
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: "Amount must be greater than 0" });
  }
  if (!category || category.trim() === "") {
    return res.status(400).json({ error: "Category is required" });
  }

  const expense = new Expense({
    userId: req.userId,
    title: title.trim(),
    amount: Math.round(Number(amount)),
    category: category.trim()
  });

  await expense.save();
  res.json(expense);
});

// Clear all expenses (BEFORE :id routes)
app.delete('/expenses/all', authMiddleware, async (req, res) => {
  try {
    await Expense.deleteMany({ userId: req.userId });
    res.json({ message: 'All expenses cleared' });
  } catch {
    res.status(500).json({ error: 'Could not clear expenses' });
  }
});

app.delete("/expenses/:id", authMiddleware, async (req, res) => {
  const removed = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.userId });

  if (!removed) {
    return res.status(404).json({ error: "Expense not found" });
  }

  res.json({ success: true });
});

app.put("/expenses/:id", authMiddleware, async (req, res) => {
  const { title, amount, category } = req.body;
  
  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Description is required" });
  }
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: "Amount must be greater than 0" });
  }
  if (!category || category.trim() === "") {
    return res.status(400).json({ error: "Category is required" });
  }

  const updated = await Expense.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    {
      title: title.trim(),
      amount: Math.round(Number(amount)),
      category: category.trim()
    },
    { new: true }
  );

  if (!updated) {
    return res.status(404).json({ error: "Expense not found" });
  }

  res.json(updated);
});

// Income routes
app.get("/income", authMiddleware, async (req, res) => {
  const data = await Income.find({ userId: req.userId });
  res.json(data);
});

app.post("/income", authMiddleware, async (req, res) => {
  const { title, amount, source } = req.body;
  
  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Source is required" });
  }
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: "Amount must be greater than 0" });
  }

  const income = new Income({
    userId: req.userId,
    title: title.trim(),
    amount: Number(amount),
    source: source || "Other"
  });

  await income.save();
  res.json(income);
});

// Clear all income history (BEFORE :id routes)
app.delete('/income/all', authMiddleware, async (req, res) => {
  try {
    await Income.deleteMany({ userId: req.userId });
    res.json({ message: 'All income history cleared' });
  } catch {
    res.status(500).json({ error: 'Could not clear income history' });
  }
});

app.delete("/income/:id", authMiddleware, async (req, res) => {
  const removed = await Income.findOneAndDelete({ _id: req.params.id, userId: req.userId });

  if (!removed) {
    return res.status(404).json({ error: "Income not found" });
  }

  res.json({ success: true });
});

app.put("/income/:id", authMiddleware, async (req, res) => {
  const { title, amount, source } = req.body;
  
  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Source is required" });
  }
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: "Amount must be greater than 0" });
  }

  const updated = await Income.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    {
      title: title.trim(),
      amount: Number(amount),
      source: source || "Other"
    },
    { new: true }
  );

  if (!updated) {
    return res.status(404).json({ error: "Income not found" });
  }

  res.json(updated);
});

// Get all upcoming payments
app.get('/upcoming', authMiddleware, async (req, res) => {
  const data = await UpcomingPayment.find({ userId: req.userId }).sort({ dueDate: 1 });
  res.json(data);
});

// Add upcoming payment
app.post('/upcoming', authMiddleware, async (req, res) => {
  const { name, amount, dueDate, type } = req.body;
  
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Title is required" });
  }
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: "Amount must be greater than 0" });
  }
  if (!dueDate) {
    return res.status(400).json({ error: "Due date is required" });
  }

  const payment = new UpcomingPayment({
    userId: req.userId,
    name: name.trim(),
    amount: Number(amount),
    dueDate: new Date(dueDate),
    type: type || 'Bill',
    status: 'Pending'
  });
  await payment.save();
  res.json(payment);
});

// Mark as paid or update payment
app.put('/upcoming/:id', authMiddleware, async (req, res) => {
  const { name, amount, dueDate, status, type } = req.body;
  
  if (name !== undefined && name.trim() === "") {
    return res.status(400).json({ error: "Title is required" });
  }
  if (amount !== undefined && (isNaN(amount) || Number(amount) <= 0)) {
    return res.status(400).json({ error: "Amount must be greater than 0" });
  }

  const updateData = {};
  if (status) updateData.status = status;
  if (name) updateData.name = name.trim();
  if (amount) updateData.amount = Number(amount);
  if (dueDate) updateData.dueDate = new Date(dueDate);
  if (type) updateData.type = type;

  const updated = await UpcomingPayment.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    updateData,
    { new: true }
  );
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

// Clear all upcoming payments (BEFORE :id routes)
app.delete('/upcoming/all', authMiddleware, async (req, res) => {
  try {
    await UpcomingPayment.deleteMany({ userId: req.userId });
    res.json({ message: 'All upcoming payments cleared' });
  } catch {
    res.status(500).json({ error: 'Could not clear upcoming payments' });
  }
});

// Delete upcoming payment
app.delete('/upcoming/:id', authMiddleware, async (req, res) => {
  const removed = await UpcomingPayment.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!removed) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// Get all goals
app.get('/goals', authMiddleware, async (req, res) => {
  try {
    const data = await Goal.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Could not fetch goals' });
  }
});

// Create goal
app.post('/goals', authMiddleware, async (req, res) => {
  try {
    const { name, targetAmount, savedAmount, category, targetDate } = req.body;
    
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Goal name is required" });
    }
    if (!targetAmount || isNaN(targetAmount) || Number(targetAmount) <= 0) {
      return res.status(400).json({ error: "Target amount must be greater than 0" });
    }
    if (savedAmount !== undefined && (isNaN(savedAmount) || Number(savedAmount) < 0)) {
      return res.status(400).json({ error: "Current amount cannot be negative" });
    }
    if (savedAmount !== undefined && Number(savedAmount) > Number(targetAmount)) {
      return res.status(400).json({ error: "Current amount cannot exceed target amount" });
    }
    if (targetDate && new Date(targetDate) <= new Date()) {
      return res.status(400).json({ error: "Deadline must be in the future" });
    }

    const goal = new Goal({
      userId: req.userId,
      name: name.trim(),
      targetAmount: Number(targetAmount),
      savedAmount: Number(savedAmount) || 0,
      category: category || 'Other',
      targetDate: targetDate ? new Date(targetDate) : null,
    });
    await goal.save();
    res.json(goal);
  } catch {
    res.status(500).json({ error: 'Could not create goal' });
  }
});

// Update goal (add money or edit)
app.put('/goals/:id', authMiddleware, async (req, res) => {
  try {
    const { name, targetAmount, savedAmount, category, targetDate, completed } = req.body;
    
    if (name !== undefined && name.trim() === "") {
      return res.status(400).json({ error: "Goal name is required" });
    }
    if (targetAmount !== undefined && (isNaN(targetAmount) || Number(targetAmount) <= 0)) {
      return res.status(400).json({ error: "Target amount must be greater than 0" });
    }
    if (savedAmount !== undefined && (isNaN(savedAmount) || Number(savedAmount) < 0)) {
      return res.status(400).json({ error: "Current amount cannot be negative" });
    }
    if (savedAmount !== undefined && targetAmount !== undefined && Number(savedAmount) > Number(targetAmount)) {
      return res.status(400).json({ error: "Current amount cannot exceed target amount" });
    }
    if (targetDate !== undefined && targetDate && new Date(targetDate) <= new Date()) {
      return res.status(400).json({ error: "Deadline must be in the future" });
    }

    const updated = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        ...(name && { name: name.trim() }),
        ...(targetAmount && { targetAmount: Number(targetAmount) }),
        ...(savedAmount !== undefined && { savedAmount: Number(savedAmount) }),
        ...(category && { category }),
        ...(targetDate !== undefined && { targetDate: targetDate ? new Date(targetDate) : null }),
        ...(completed !== undefined && { completed }),
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Goal not found' });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Could not update goal' });
  }
});

// Clear all goals (BEFORE :id routes)
app.delete('/goals/all', authMiddleware, async (req, res) => {
  try {
    await Goal.deleteMany({ userId: req.userId });
    res.json({ message: 'All goals cleared' });
  } catch {
    res.status(500).json({ error: 'Could not clear goals' });
  }
});

// Delete goal
app.delete('/goals/:id', authMiddleware, async (req, res) => {
  try {
    const removed = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!removed) return res.status(404).json({ error: 'Goal not found' });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Could not delete goal' });
  }
});

// Change password
app.put('/profile/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || currentPassword.trim() === "") {
      return res.status(400).json({ error: 'Current password is required' });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ error: 'Current password is incorrect' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch {
    res.status(500).json({ error: 'Could not update password' });
  }
});

// Get profile
app.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Could not fetch profile' });
  }
});

// Reset income
app.put('/received/reset', authMiddleware, async (req, res) => {
  try {
    await Income.deleteMany({ userId: req.userId });
    const summaryKey = `user:${req.userId}`;
    await Summary.findOneAndUpdate(
      { key: summaryKey },
      { totalReceived: 0 },
      { upsert: true }
    );
    res.json({ message: 'Income reset successfully' });
  } catch {
    res.status(500).json({ error: 'Could not reset income' });
  }
});

// Get received
app.get("/received", authMiddleware, async (req, res) => {
  const summaryKey = `user:${req.userId}`;
  const summary = await Summary.findOne({ key: summaryKey });
  res.json({ totalReceived: summary?.totalReceived || 0 });
});

app.post("/received", authMiddleware, async (req, res) => {
  const amount = Number(req.body.amount);
  const summaryKey = `user:${req.userId}`;

  if (Number.isNaN(amount)) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  const summary = await Summary.findOneAndUpdate(
    { key: summaryKey },
    {
      $inc: { totalReceived: amount },
      $setOnInsert: { key: summaryKey, userId: req.userId }
    },
    { new: true, upsert: true }
  );

  res.json({ totalReceived: summary.totalReceived });
});

// Delete account
app.delete('/account', authMiddleware, async (req, res) => {
  try {
    await Expense.deleteMany({ userId: req.userId });
    await Income.deleteMany({ userId: req.userId });
    await Summary.deleteMany({ userId: req.userId });
    await UpcomingPayment.deleteMany({ userId: req.userId });
    await Goal.deleteMany({ userId: req.userId });
    await User.findByIdAndDelete(req.userId);
    res.json({ message: 'Account deleted successfully' });
  } catch {
    res.status(500).json({ error: 'Could not delete account' });
  }
});

// AI Budget Advisor
app.post('/ai/insights', authMiddleware, async (req, res) => {
  try {
    const { expenses, totalReceived, totalSpent } = req.body;

    const prompt = `You are a personal finance advisor. Analyze this user's expense data and give 4-5 short, practical, personalized insights and tips. Be specific with numbers. Keep each insight to 1-2 sentences. Use simple language.

Data:
- Total Income: Rs.${totalReceived}
- Total Spent: Rs.${totalSpent}
- Balance: Rs.${totalReceived - totalSpent}
- Expenses: ${JSON.stringify(expenses.map(e => ({ title: e.title, amount: e.amount, category: e.category || 'Other' })))}

Return the analysis as a single JSON object with a key named "insight". Do not include any other text or explanation.`;

    try {
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      });

      const modelResult = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        },
      });

      const result = await modelResult.response;
      res.json({ insight: result.text() });
    } catch (genErr) {
      if (genErr?.status === 429 || genErr?.message?.includes('quota')) {
        console.log('Quota exceeded for insights:', genErr?.message || genErr);
        return res.status(429).json({ error: 'API quota exceeded. Please try again later.' });
      }
      throw genErr;
    }
  } catch (err) {
    console.log('Error in insights route:', err?.message || err);
    res.status(500).json({ error: 'Could not generate insights. Please try again later.' });
  }
});

// Bank Statement Importer
app.post('/ai/import', authMiddleware, async (req, res) => {
  try {
    const { statement } = req.body;

    const prompt = `You are an Indian bank statement parser. Parse ALL transactions from this statement and classify each as either a debit (expense) or credit (income).

Statement:
${statement}

Rules:
- Debit = money going OUT (UPI/DR, ATM WDL, purchases, payments, bills)
- Credit = money coming IN (salary, NEFT/CR, UPI/CR, refunds, cashback, deposits)
- Amount must be a positive number
- For debits guess category: Food/Travel/Shopping/Bills/Health/Other
- For credits guess source: Salary/Freelance/Business/Investment/Gift/Other
- Keep title short and clean

Return ONLY a valid JSON array, no markdown, no explanation:
[{"title":"name","amount":number,"type":"debit","category":"Food"}]
For credits use: {"title":"name","amount":number,"type":"credit","source":"Salary"}`;

    try {
      const text = await generateGeminiText(prompt);
      const cleanJson = text.replace(/```json|```/g, '').trim();
      const transactions = JSON.parse(cleanJson);
      res.json({ transactions });
    } catch (genErr) {
      if (genErr?.status === 429 || genErr?.message?.includes('quota')) {
        console.log('Quota exceeded for import:', genErr?.message || genErr);
        return res.status(429).json({ error: 'API quota exceeded. Please try again later.' });
      }
      throw genErr;
    }
  } catch (err) {
    console.log('Error in import route:', err?.message || err);
    res.status(500).json({ error: 'Could not parse statement. Please try again later.' });
  }
});

// Angel One SmartAPI Integration
const angelLogin = async (clientCode, pin, totpSecret) => {
  const totp = speakeasy.totp({
    secret: totpSecret,
    encoding: 'base32',
  });

  const res = await fetch('https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-UserType': 'USER',
      'X-SourceID': 'WEB',
      'X-ClientLocalIP': '127.0.0.1',
      'X-ClientPublicIP': '127.0.0.1',
      'X-MACAddress': '00:00:00:00:00:00',
      'X-PrivateKey': process.env.ANGEL_API_KEY,
    },
    body: JSON.stringify({
      clientcode: clientCode,
      password: pin,
      totp,
    }),
  });

  const data = await res.json();
  if (!data.data?.jwtToken) throw new Error(data.message || 'Angel One login failed');
  return data.data.jwtToken;
};

const angelHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-UserType': 'USER',
  'X-SourceID': 'WEB',
  'X-ClientLocalIP': '127.0.0.1',
  'X-ClientPublicIP': '127.0.0.1',
  'X-MACAddress': '00:00:00:00:00:00',
  'X-PrivateKey': process.env.ANGEL_API_KEY,
});

const getValidToken = async (userId) => {
  const user = await User.findById(userId);
  if (!user.angelOne?.connected) throw new Error('DISCONNECTED');
  if (!user.angelOne?.token) throw new Error('TOKEN_EXPIRED');
  const now = new Date();
  if (user.angelOne.tokenExpiry && now >= user.angelOne.tokenExpiry) throw new Error('TOKEN_EXPIRED');
  return user.angelOne.token;
};

// Check Angel One connection status
app.get('/angel/status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.angelOne?.connected) return res.json({ connected: false });
    const now = new Date();
    const expired = !user.angelOne.token || (user.angelOne.tokenExpiry && now >= user.angelOne.tokenExpiry);
    res.json({ connected: true, expired });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Connect Angel One account
app.post('/angel/connect', authMiddleware, async (req, res) => {
  try {
    const { clientCode, pin, totpSecret } = req.body;
    if (!clientCode || !pin || !totpSecret) {
      return res.status(400).json({ error: 'Client ID, MPIN and TOTP Secret are required' });
    }
    const token = await angelLogin(clientCode, pin, totpSecret);
    const tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1000);
    await User.findByIdAndUpdate(req.userId, {
      'angelOne.token': token,
      'angelOne.tokenExpiry': tokenExpiry,
      'angelOne.connected': true,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Disconnect Angel One account
app.post('/angel/disconnect', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      'angelOne.token': '',
      'angelOne.tokenExpiry': null,
      'angelOne.connected': false,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/angel/holdings', authMiddleware, async (req, res) => {
  try {
    const token = await getValidToken(req.userId);
    const response = await fetch('https://apiconnect.angelbroking.com/rest/secure/angelbroking/portfolio/v1/getHolding', {
      headers: angelHeaders(token),
    });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(503).json({ error: 'MARKET_CLOSED' });
    }
    res.json(data.data || []);
  } catch (err) {
    if (err.message === 'TOKEN_EXPIRED') return res.status(401).json({ error: 'TOKEN_EXPIRED' });
    if (err.message === 'DISCONNECTED') return res.status(401).json({ error: 'DISCONNECTED' });
    res.status(500).json({ error: err.message });
  }
});

app.get('/angel/trades', authMiddleware, async (req, res) => {
  try {
    const token = await getValidToken(req.userId);
    const response = await fetch('https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/getTradeBook', {
      headers: angelHeaders(token),
    });
    const data = await response.json();
    res.json(data.data || []);
  } catch (err) {
    if (err.message === 'TOKEN_EXPIRED') return res.status(401).json({ error: 'TOKEN_EXPIRED' });
    if (err.message === 'DISCONNECTED') return res.status(401).json({ error: 'DISCONNECTED' });
    res.status(500).json({ error: err.message });
  }
});

app.post('/angel/import-trades', authMiddleware, async (req, res) => {
  try {
    const token = await getValidToken(req.userId);
    const response = await fetch('https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/getTradeBook', {
      headers: angelHeaders(token),
    });
    const data = await response.json();
    const trades = data.data || [];
    
    const imported = [];
    for (const t of trades) {
      const isBuy = t.transactiontype === 'BUY';
      const amount = Math.round(parseFloat(t.quantity) * parseFloat(t.tradeprice));
      
      if (isBuy) {
        const expense = new Expense({
          userId: req.userId,
          title: `${t.tradingsymbol} (Stock Purchase)`,
          amount,
          category: 'Other',
        });
        await expense.save();
        imported.push(expense);
      } else {
        const income = new Income({
          userId: req.userId,
          title: `${t.tradingsymbol} (Stock Sale)`,
          amount,
          source: 'Investment',
        });
        await income.save();
        imported.push(income);
      }
    }
    
    res.json({ imported: imported.length, trades: imported });
  } catch (err) {
    if (err.message === 'TOKEN_EXPIRED') return res.status(401).json({ error: 'TOKEN_EXPIRED' });
    if (err.message === 'DISCONNECTED') return res.status(401).json({ error: 'DISCONNECTED' });
    res.status(500).json({ error: err.message });
  }
});

// start server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
