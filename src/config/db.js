const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);

    // Listeners útiles para monitorear la conexión en producción o desarrollo
    mongoose.connection.on('error', (err) => {
      console.error(`⚠️ Error de conexión en MongoDB: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('🔌 MongoDB desconectado');
    });
  } catch (error) {
    console.error(`❌ Error al conectar a MongoDB: ${error.message}`);
    process.exit(1); // Detiene el proceso si no hay base de datos
  }
};

module.exports = connectDB;