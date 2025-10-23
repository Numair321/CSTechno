import mongoose from "mongoose";

const agentSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  mobile: String,
  password: String,
});

export default mongoose.model("Agent", agentSchema);
