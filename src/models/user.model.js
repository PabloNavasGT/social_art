const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
  gmail: {
    type: String,
    required: [true, 'El correo Gmail es obligatorio'],
    unique: true,
    lowercase: true,
    match: [/^[a-zA-Z0-9._%+-]+@gmail\.com$/, 'Debe ser una cuenta @gmail.com válida']
  },
  password: { type: String, required: [true, 'La contraseña es obligatoria'], select: false },
  nombreArtista: { type: String, trim: true, default: function () { return this.nombre; } },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  seguidores: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  siguiendo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  aceptaComisiones: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);