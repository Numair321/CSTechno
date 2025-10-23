import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));

async function createAdmin() {
  const email = "maliknumair21@gmail.com";
  const password = "admin123";

  const existing = await User.findOne({ email });
  if (existing) {
    console.log("⚠️ Admin already exists with this email:", email);
    return mongoose.disconnect();
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    name: "Admin",
    email,
    password: hashedPassword,
    role: "admin",
  });

  await user.save();
  console.log("✅ Admin user created with password:", password);
  mongoose.disconnect();
}

createAdmin();
