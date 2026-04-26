import mongoose from 'mongoose';

const gameRecordSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  rival: {
    type: String,
    required: true,  
  },
  resultado: {
    type: String,
    enum: ['1', '2'],
    required: true,  
  },
  size: {
    type: Number,
    required: false, 
  },
}, { timestamps: true });  

export default mongoose.model('GameRecord', gameRecordSchema);
