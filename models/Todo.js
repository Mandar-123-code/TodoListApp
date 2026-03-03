import mongoose from "mongoose";

mongoose
  .connect(
    "mongodb+srv://kulkarnimandar702:root@mymongodbcluster.2sfzk.mongodb.net/todoAppExpress",
  )
  .then(() => console.log("Connected to MongoDB Successfully!"))
  .catch(() => console.log("Failed to Connect to MongoDB!"));

const TodoSchema = new mongoose.Schema({
  title: String,
  desc: String,
  isDone: Boolean,
});

export const Todo = mongoose.model("todos", TodoSchema);
