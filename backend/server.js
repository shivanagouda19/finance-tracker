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

const SummarySchema = new mongoose.Schema({
  key: { type: String, unique: true },
  userId: String,
  totalReceived: { type: Number, default: 0 }
});

const Summary = mongoose.model("Summary", SummarySchema);

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

// start server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
