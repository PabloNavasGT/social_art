const mongoose = require('mongoose');

const mediaItemSchema = new mongoose.Schema({
  url: { type: String, required: true },
  tipo: { type: String, enum: ['image', 'video'], default: 'image' }
}, { _id: false });

const artworkSchema = new mongoose.Schema({
  titulo: { type: String, required: [true, 'El nombre del dibujo es obligatorio'], trim: true },
  descripcion: { type: String, trim: true, maxlength: 1000 },
  media: {
    type: [mediaItemSchema],
    validate: [arr => arr.length > 0, 'Debes incluir al menos una imagen o video']
  },
  etiquetas: [{ type: String, lowercase: true, trim: true }],
  redesSociales: {
    instagram: { type: String, trim: true },
    twitter: { type: String, trim: true },
    artstation: { type: String, trim: true },
    otro: { type: String, trim: true }
  },
  autor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

artworkSchema.index({ createdAt: -1 });
artworkSchema.index({ etiquetas: 1 });

module.exports = mongoose.model('Artwork', artworkSchema);