const User = require('../models/user.model');

class UserRepository {
  async create(userData) {
    return await new User(userData).save();
  }

  async findByGmail(gmail, includePassword = false) {
    const query = User.findOne({ gmail });
    if (includePassword) query.select('+password');
    return await query.exec();
  }

  async findById(id) {
    return await User.findById(id).select('-password');
  }

  async toggleFollow(currentUserId, targetUserId) {
    const currentUser = await User.findById(currentUserId);
    const isFollowing = currentUser.siguiendo.includes(targetUserId);

    if (isFollowing) {
      await User.findByIdAndUpdate(currentUserId, { $pull: { siguiendo: targetUserId } });
      await User.findByIdAndUpdate(targetUserId, { $pull: { seguidores: currentUserId } });
      return false;
    } else {
      await User.findByIdAndUpdate(currentUserId, { $addToSet: { siguiendo: targetUserId } });
      await User.findByIdAndUpdate(targetUserId, { $addToSet: { seguidores: currentUserId } });
      return true;
    }
  }

  async updateCommissionStatus(userId, aceptaComisiones) {
    return await User.findByIdAndUpdate(
      userId,
      { aceptaComisiones },
      { new: true }
    ).select('-password');
  }
}

module.exports = new UserRepository();