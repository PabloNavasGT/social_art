const commissionRepository = require('../repositories/commission.repository');
const userRepository = require('../repositories/user.repository');

class CommissionService {
  async requestCommission(clienteId, artistaId, detallesIniciales) {
    if (clienteId === artistaId) {
      throw { statusCode: 400, message: 'No puedes pedirte una comisión a ti mismo' };
    }

    const artista = await userRepository.findById(artistaId);
    if (!artista) throw { statusCode: 404, message: 'Artista no encontrado' };
    if (!artista.aceptaComisiones) {
      throw { statusCode: 403, message: 'Este artista tiene las comisiones desactivadas' };
    }

    return await commissionRepository.create({
      cliente: clienteId,
      artista: artistaId,
      detallesIniciales,
      mensajes: [{ remitente: clienteId, texto: `Solicitud de comisión: ${detallesIniciales}` }]
    });
  }

  async getMyCommissions(userId) {
    return await commissionRepository.findByUser(userId);
  }

  async respondCommission(commissionId, artistaId, estado) {
    const comm = await commissionRepository.findById(commissionId);
    if (!comm) throw { statusCode: 404, message: 'Solicitud no encontrada' };
    if (comm.artista._id.toString() !== artistaId) {
      throw { statusCode: 403, message: 'Solo el artista puede aceptar o rechazar esta comisión' };
    }
    if (!['aceptada', 'rechazada'].includes(estado)) {
      throw { statusCode: 400, message: 'Estado inválido' };
    }

    return await commissionRepository.updateStatus(commissionId, estado);
  }

  async sendMessage(commissionId, userId, texto) {
    const comm = await commissionRepository.findById(commissionId);
    if (!comm) throw { statusCode: 404, message: 'Chat no encontrado' };
    if (comm.estado !== 'aceptada') {
      throw { statusCode: 403, message: 'El chat se habilita únicamente cuando el artista acepta la comisión' };
    }

    const isParticipant = [comm.cliente._id.toString(), comm.artista._id.toString()].includes(userId);
    if (!isParticipant) throw { statusCode: 403, message: 'No perteneces a este chat' };

    return await commissionRepository.addMessage(commissionId, userId, texto);
  }
}

module.exports = new CommissionService();