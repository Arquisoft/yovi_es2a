import mongoose from 'mongoose';

//La estructura del usuario para nuestra BD
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
}, { timestamps: true });   //Añade automoaticamente createdAT y updatedAT

//Crea y exporta el modelo User basado en userSchema
export default mongoose.model('User', userSchema);