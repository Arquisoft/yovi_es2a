import mongoose from 'mongoose';

// Schema para membresía en grupos
const groupMemberSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  }
}, { timestamps: true });

// Índice único compound: no duplicados de (groupId, username)
groupMemberSchema.index({ groupId: 1, username: 1 }, { unique: true });

export default mongoose.model('GroupMember', groupMemberSchema);
