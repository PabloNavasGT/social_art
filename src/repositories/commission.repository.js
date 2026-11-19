const Commission = require('../models/commission.model');

class CommissionRepository {
  async create(data) {
    return await new Commission(data).save();
  }

  async findByUser(userId) {
    return await Commission.find({
      $or: [{ cliente: userId }, { artista: userId }]
    })
      .populate('cliente', 'nombre nombreArtista')
      .populate('artista', 'nombre nombreArtista')
      .sort({ updatedAt: -1 });
  }

  async findById(id) {
    return await Commission.findById(id)
      .populate('cliente', 'nombre nombreArtista')
      .populate('artista', 'nombre nombreArtista');
  }

  async updateStatus(id, estado) {
    return await Commission.findByIdAndUpdate(id, { estado }, { new: true })
      .populate('cliente', 'nombre nombreArtista')
      .populate('artista', 'nombre nombreArtista');
  }

  async addMessage(id, remitente, texto) {
    return await Commission.findByIdAndUpdate(
      id,
      { $push: { mensajes: { remitente, texto } } },
      { new: true }
    )
      .populate('cliente', 'nombre nombreArtista')
      .populate('artista', 'nombre nombreArtista');
  }
}

module.exports = new CommissionRepository();