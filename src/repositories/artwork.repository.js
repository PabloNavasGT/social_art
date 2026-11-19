const Artwork = require('../models/artwork.model');

class ArtworkRepository {
  async create(artworkData) {
    return await new Artwork(artworkData).save();
  }

  async findAllPaginated(page = 1, limit = 10, tag = null) {
    const skip = (page - 1) * limit;
    const filter = tag ? { etiquetas: tag.toLowerCase().replace('#', '') } : {};
    
    const [artworks, total] = await Promise.all([
      Artwork.find(filter)
        .populate('autor', 'nombre nombreArtista aceptaComisiones')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Artwork.countDocuments(filter)
    ]);

    return {
      artworks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    };
  }

  async findByAuthorId(authorId) {
    return await Artwork.find({ autor: authorId }).sort({ createdAt: -1 }).lean();
  }
}

module.exports = new ArtworkRepository();