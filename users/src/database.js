import mongoose from 'mongoose';

//Funcion async que establece la conexión con MongoDB
const connectDB = async () => {
  try {
    //Intenta conectarse a MongoDB usando la URL del archivo .env
    await mongoose.connect(process.env.MONGODB_STRING);
    console.log("MongoDB conectado");
  } catch (error) {
    //Si la conexión falla, muestra el error y cierra el proceso.
    console.error("Error conectando a MongoDB:", error);
    process.exit(1);
  }
};

// Exporta la función para usarla en users-service.js
export default connectDB;