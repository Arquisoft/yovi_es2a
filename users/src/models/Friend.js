import mongoose from 'mongoose';

// Schema para relaciones de amistad entre usuarios
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

// Índice único compound: no duplicados de (from, to)
friendSchema.index({ from: 1, to: 1 }, { unique: true });

export default mongoose.model('Friend', friendSchema);
