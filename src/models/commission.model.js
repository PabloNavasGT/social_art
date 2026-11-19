const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  remitente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  texto: { type: String, required: true, trim: true },
  fecha: { type: Date, default: Date.now }
});

const commissionSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  artista: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  detallesIniciales: { type: String, required: true, trim: true },
  estado: {
    type: String,
    enum: ['pendiente', 'aceptada', 'rechazada'],
    default: 'pendiente'
  },
  mensajes: [messageSchema]
}, { timestamps: true });

module.exports = mongoose.model('Commission', commissionSchema);