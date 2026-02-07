import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  googleApiKey: { type: String },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/energy_consumption_solid';
  console.log('Connecting to', MONGODB_URI);
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    console.log('Connected');
    
    const user = await User.findOne({ email: 'email@example.com' });
    if (user) {
      console.log('User found:', user.email);
      const isMatch = await bcrypt.compare('password', user.password);
      console.log('Password matches:', isMatch);
    } else {
      console.log('User not found');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

run();
