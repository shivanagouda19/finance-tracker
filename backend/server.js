const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/User");
const app = express();
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "SECRET_KEY";

app.use(cors());
app.use(express.json());

// connect MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/expenses");

mongoose.connection.once("open", () => {
  console.log("MongoDB connected");
});

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

// routes
app.post("/signup", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
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

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
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
  const expense = new Expense({
    userId: req.userId,
    title: req.body.title,
    amount: Number(req.body.amount),
    category: req.body.category || "Other"
  });

  if (!expense.title || Number.isNaN(expense.amount)) {
    return res.status(400).json({ error: "Invalid expense" });
  }

  await expense.save();
  res.json(expense);
});

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

app.delete("/expenses/:id", authMiddleware, async (req, res) => {
  const removed = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.userId });

  if (!removed) {
    return res.status(404).json({ error: "Expense not found" });
  }

  res.json({ success: true });
});

app.put("/expenses/:id", authMiddleware, async (req, res) => {
  const updated = await Expense.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    {
      title: req.body.title,
      amount: Number(req.body.amount),
      category: req.body.category || "Other"
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
  const income = new Income({
    userId: req.userId,
    title: req.body.title,
    amount: Number(req.body.amount),
    source: req.body.source || "Other"
  });

  if (!income.title || Number.isNaN(income.amount)) {
    return res.status(400).json({ error: "Invalid income" });
  }

  await income.save();
  res.json(income);
});

app.delete("/income/:id", authMiddleware, async (req, res) => {
  const removed = await Income.findOneAndDelete({ _id: req.params.id, userId: req.userId });

  if (!removed) {
    return res.status(404).json({ error: "Income not found" });
  }

  res.json({ success: true });
});

app.put("/income/:id", authMiddleware, async (req, res) => {
  const updated = await Income.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    {
      title: req.body.title,
      amount: Number(req.body.amount),
      source: req.body.source || "Other"
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
  const payment = new UpcomingPayment({
    userId: req.userId,
    name: req.body.name,
    amount: Number(req.body.amount),
    dueDate: new Date(req.body.dueDate),
    type: req.body.type || 'Bill',
    status: 'Pending'
  });
  await payment.save();
  res.json(payment);
});

// Mark as paid or update payment
app.put('/upcoming/:id', authMiddleware, async (req, res) => {
  const updateData = {};
  if (req.body.status) updateData.status = req.body.status;
  if (req.body.name) updateData.name = req.body.name;
  if (req.body.amount) updateData.amount = Number(req.body.amount);
  if (req.body.dueDate) updateData.dueDate = new Date(req.body.dueDate);
  if (req.body.type) updateData.type = req.body.type;

  const updated = await UpcomingPayment.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    updateData,
    { new: true }
  );
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
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
    const goal = new Goal({
      userId: req.userId,
      name: req.body.name,
      targetAmount: Number(req.body.targetAmount),
      savedAmount: Number(req.body.savedAmount) || 0,
      category: req.body.category || 'Other',
      targetDate: req.body.targetDate ? new Date(req.body.targetDate) : null,
    });
    if (!goal.name || !goal.targetAmount) {
      return res.status(400).json({ error: 'Name and target amount are required' });
    }
    await goal.save();
    res.json(goal);
  } catch {
    res.status(500).json({ error: 'Could not create goal' });
  }
});

// Update goal (add money or edit)
app.put('/goals/:id', authMiddleware, async (req, res) => {
  try {
    const updated = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        ...(req.body.name && { name: req.body.name }),
        ...(req.body.targetAmount && { targetAmount: Number(req.body.targetAmount) }),
        ...(req.body.savedAmount !== undefined && { savedAmount: Number(req.body.savedAmount) }),
        ...(req.body.category && { category: req.body.category }),
        ...(req.body.targetDate !== undefined && { targetDate: req.body.targetDate ? new Date(req.body.targetDate) : null }),
        ...(req.body.completed !== undefined && { completed: req.body.completed }),
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Goal not found' });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Could not update goal' });
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

// Clear all goals (for profile reset)
app.delete('/goals/all', authMiddleware, async (req, res) => {
  try {
    await Goal.deleteMany({ userId: req.userId });
    res.json({ message: 'All goals cleared' });
  } catch {
    res.status(500).json({ error: 'Could not clear goals' });
  }
});

// Change password
app.put('/profile/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both passwords required' });
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

// Clear all expenses
app.delete('/expenses/all', authMiddleware, async (req, res) => {
  try {
    await Expense.deleteMany({ userId: req.userId });
    res.json({ message: 'All expenses cleared' });
  } catch {
    res.status(500).json({ error: 'Could not clear expenses' });
  }
});

// Reset income
app.put('/received/reset', authMiddleware, async (req, res) => {
  try {
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

// Clear all upcoming payments
app.delete('/upcoming/all', authMiddleware, async (req, res) => {
  try {
    await UpcomingPayment.deleteMany({ userId: req.userId });
    res.json({ message: 'All upcoming payments cleared' });
  } catch {
    res.status(500).json({ error: 'Could not clear upcoming payments' });
  }
});

// Delete account
app.delete('/account', authMiddleware, async (req, res) => {
  try {
    await Expense.deleteMany({ userId: req.userId });
    await Summary.deleteMany({ userId: req.userId });
    await UpcomingPayment.deleteMany({ userId: req.userId });
    await User.findByIdAndDelete(req.userId);
    res.json({ message: 'Account deleted successfully' });
  } catch {
    res.status(500).json({ error: 'Could not delete account' });
  }
});

// Clear all income history
app.delete('/income/all', authMiddleware, async (req, res) => {
  try {
    await Income.deleteMany({ userId: req.userId });
    res.json({ message: 'All income history cleared' });
  } catch {
    res.status(500).json({ error: 'Could not clear income history' });
  }
});

// start server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
