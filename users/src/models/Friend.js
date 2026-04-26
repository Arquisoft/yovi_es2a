import mongoose from 'mongoose';

const friendSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true,
    index: true
  },
  to: {
    type: String,
    required: true,
    index: true
  }
}, { timestamps: true });

friendSchema.index({ from: 1, to: 1 }, { unique: true });

export default mongoose.model('Friend', friendSchema);
