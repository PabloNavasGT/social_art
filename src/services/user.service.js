const userRepository = require('../repositories/user.repository');

class UserService {
  async toggleFollow(currentUserId, targetUserId) {
    if (currentUserId === targetUserId) {
      throw { statusCode: 400, message: 'No puedes seguirte a ti mismo' };
    }
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      throw { statusCode: 404, message: 'Usuario no encontrado' };
    }

    const following = await userRepository.toggleFollow(currentUserId, targetUserId);
    const updatedTarget = await userRepository.findById(targetUserId);

    return {
      siguiendo: following,
      totalSeguidores: updatedTarget.seguidores.length
    };
  }

  async toggleCommissions(userId, status) {
    const updated = await userRepository.updateCommissionStatus(userId, Boolean(status));
    return { aceptaComisiones: updated.aceptaComisiones };
  }
}

module.exports = new UserService();