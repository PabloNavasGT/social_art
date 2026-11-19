const commissionService = require('../services/commission.service');

class CommissionController {
  async create(req, res, next) {
    try {
      const { artistaId, detallesIniciales } = req.body;
      const result = await commissionService.requestCommission(req.user.id, artistaId, detallesIniciales);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async list(req, res, next) {
    try {
      const result = await commissionService.getMyCommissions(req.user.id);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async respond(req, res, next) {
    try {
      const result = await commissionService.respondCommission(req.params.id, req.user.id, req.body.estado);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async sendMessage(req, res, next) {
    try {
      const result = await commissionService.sendMessage(req.params.id, req.user.id, req.body.texto);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }
}

module.exports = new CommissionController();