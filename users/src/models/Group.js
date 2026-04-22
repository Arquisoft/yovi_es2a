import mongoose from 'mongoose';

// Schema para grupos/comunidades públicas de usuarios
const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  createdBy: {
    type: String,
    required: true,
    index: true
  },
  isPublic: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model('Group', groupSchema);
