const artworkService = require('../services/artwork.service');

class ArtworkController {
  async create(req, res, next) {
    try {
      const artwork = await artworkService.publishArtwork(req.user.id, req.body, req.files);
      res.status(201).json({ success: true, data: artwork });
    } catch (err) { next(err); }
  }

  async getFeed(req, res, next) {
    try {
      const { page, limit, tag } = req.query;
      const feed = await artworkService.getFeed(page, limit, tag);
      res.json({ success: true, data: feed });
    } catch (err) { next(err); }
  }

  async getUserGallery(req, res, next) {
    try {
      const profileData = await artworkService.getArtistProfileAndArtworks(req.params.userId, req.user.id);
      res.json({ success: true, data: profileData });
    } catch (err) { next(err); }
  }
}

module.exports = new ArtworkController();