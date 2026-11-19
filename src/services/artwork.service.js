const artworkRepository = require('../repositories/artwork.repository');
const userRepository = require('../repositories/user.repository');

class ArtworkService {
  async publishArtwork(userId, artworkData, uploadedFiles = []) {
    const { titulo, descripcion, etiquetas, redesSociales, urlsExternas } = artworkData;

    if (!titulo) {
      throw { statusCode: 400, message: 'El título es obligatorio' };
    }

    // Construir lista de media (archivos arrastrados + URLs opcionales)
    const mediaList = [];

    uploadedFiles.forEach(file => {
      const tipo = file.mimetype.startsWith('video/') ? 'video' : 'image';
      mediaList.push({
        url: `http://localhost:${process.env.PORT || 3000}/uploads/${file.filename}`,
        tipo
      });
    });

    if (urlsExternas) {
      const parsedUrls = Array.isArray(urlsExternas) ? urlsExternas : JSON.parse(urlsExternas);
      parsedUrls.forEach(item => {
        if (item.url) mediaList.push({ url: item.url, tipo: item.tipo || 'image' });
      });
    }

    if (mediaList.length === 0) {
      throw { statusCode: 400, message: 'Debes subir al menos una imagen o video' };
    }

    // Procesar etiquetas (#fantasia, #oc -> ['fantasia', 'oc'])
    let parsedTags = [];
    if (etiquetas) {
      const rawTags = Array.isArray(etiquetas) ? etiquetas : etiquetas.split(',');
      parsedTags = [...new Set(
        rawTags.map(t => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean)
      )];
    }

    const parsedSocials = typeof redesSociales === 'string' 
      ? JSON.parse(redesSociales) 
      : (redesSociales || {});

    return await artworkRepository.create({
      titulo,
      descripcion,
      media: mediaList,
      etiquetas: parsedTags,
      redesSociales: parsedSocials,
      autor: userId
    });
  }

  async getFeed(page, limit, tag) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    return await artworkRepository.findAllPaginated(pageNum, limitNum, tag);
  }

  async getArtistProfileAndArtworks(artistId, requesterId) {
    const artist = await userRepository.findById(artistId);
    if (!artist) throw { statusCode: 404, message: 'Artista no encontrado' };

    const artworks = await artworkRepository.findByAuthorId(artistId);
    const loSigo = requesterId 
      ? artist.seguidores.some(id => id.toString() === requesterId)
      : false;

    return {
      artista: {
        id: artist._id,
        nombre: artist.nombre,
        nombreArtista: artist.nombreArtista,
        miembroDesde: artist.createdAt,
        totalSeguidores: artist.seguidores.length,
        totalSiguiendo: artist.siguiendo.length,
        aceptaComisiones: artist.aceptaComisiones,
        loSigo
      },
      totalPublicaciones: artworks.length,
      publicaciones: artworks
    };
  }
}

module.exports = new ArtworkService();