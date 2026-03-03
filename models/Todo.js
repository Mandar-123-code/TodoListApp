import mongoose from "mongoose";

mongoose
  .connect(
    "mongodb+srv://kulkarnimandar702:root@mymongodbcluster.2sfzk.mongodb.net/todo",
  )
  .then(() => console.log("Connected to MongoDB Successfully!"))
  .catch(() => console.log("Failed to Connect to MongoDB!"));

const TodoSchema = new mongoose.Schema({
  title: String,
  desc: String,
  isDone: Boolean,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
});

export const Todo = mongoose.model("todos", TodoSchema);
