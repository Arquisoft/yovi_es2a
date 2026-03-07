import mongoose from 'mongoose';

// Modelo que representa una partida finalizada en el historial
const gameRecordSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  rival: {
    type: String,
    required: true,   // nombre exacto del bot (ej. "random_bot") o "invitado"
  },
  resultado: {
    type: String,
    enum: ['1', 'X', '2'],
    required: true,   // '1' = gana el usuario logueado, '2' = pierde, 'X' = empate
  },
}, { timestamps: true });  // createdAt actúa como fecha de la partida

export default mongoose.model('GameRecord', gameRecordSchema);
