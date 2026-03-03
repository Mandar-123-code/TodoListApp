import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { Todo } from "./models/Todo.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const mongoURL = process.env.MONGODB_URI;

if (!mongoURL) {
  console.error("MONGODB_URI not defined in .env");
  process.exit(1);
}

if (mongoose.connection.readyState === 0) {
  mongoose
    .connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => {
      console.error("MongoDB connection error:", err);
      process.exit(1);
    });
} else {
  console.log("MongoDB already connected");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "TodoList.html")),
);

app.post("/add", async (req, res) => {
  try {
    const { title, desc } = req.body;
    if (!title || !desc)
      return res.status(400).json({ message: "All fields required" });

    const todo = new Todo({ title, desc, isDone: false });
    await todo.save();
    res.json({ message: "Todo Added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding todo" });
  }
});
app.get("/todos", async (req, res) => {
  try {
    const todos = await Todo.find();
    res.json(todos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching todos" });
  }
});

app.put("/update/:id", async (req, res) => {
  try {
    await Todo.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
});

app.delete("/delete/:id", async (req, res) => {
  try {
    await Todo.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`),
);
