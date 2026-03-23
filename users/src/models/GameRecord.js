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
    enum: ['1', '2'],
    required: true,   // '1' = gana el usuario logueado, '2' = pierde
  },
  size: {
    type: Number,
    required: false,  // tamaño del tablero (ej. 7 para un tablero 7x7)
  },
}, { timestamps: true });  // createdAt actúa como fecha de la partida

export default mongoose.model('GameRecord', gameRecordSchema);
