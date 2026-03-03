import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import { Todo } from "./models/Todo.js";
import { User } from "./models/User.js";
import { verifyToken } from "./middleware/auth.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

const mongoURL = process.env.MONGODB_URI;

mongoose
  .connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "TodoList.html"));
});
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    const users = await User.find({ username });

    for (const user of users) {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        return res.status(400).json({
          message: "A user with the same username and password already exists",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });

    await newUser.save();

    res.status(201).json({ message: "User Registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error registering user" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "User not found" });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

app.post("/add", verifyToken, async (req, res) => {
  try {
    const { title, desc, isDone } = req.body;

    const todo = new Todo({
      title,
      desc,
      isDone,
      user: req.user.id,
    });

    await todo.save();
    res.json({ message: "Todo Added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding todo" });
  }
});

app.get("/todos", verifyToken, async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.user.id });
    res.json(todos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching todos" });
  }
});

app.put("/update/:id", verifyToken, async (req, res) => {
  try {
    await Todo.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
    );
    res.json({ message: "Updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
});

app.delete("/delete/:id", verifyToken, async (req, res) => {
  try {
    await Todo.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
