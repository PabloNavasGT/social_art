const userService = require('../services/user.service');

class UserController {
  async toggleFollow(req, res, next) {
    try {
      const result = await userService.toggleFollow(req.user.id, req.params.userId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async toggleCommissions(req, res, next) {
    try {
      const result = await userService.toggleCommissions(req.user.id, req.body.aceptaComisiones);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }
}

module.exports = new UserController();