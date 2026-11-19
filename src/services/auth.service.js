const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');

class AuthService {
  async register(data) {
    const { nombre, gmail, password, nombreArtista, adminPassword } = data;

    // 1. Verificar si el correo ya existe
    const existingUser = await userRepository.findByGmail(gmail);
    if (existingUser) {
      throw { statusCode: 400, message: 'Este correo Gmail ya está registrado' };
    }

    // 2. Validar rol de administrador
    let role = 'user';
    if (adminPassword) {
      if (adminPassword === process.env.ADMIN_SECRET_CODE) {
        role = 'admin';
      } else {
        throw { statusCode: 403, message: 'La contraseña de administrador es incorrecta' };
      }
    }

    // 3. Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Crear usuario
    const newUser = await userRepository.create({
      nombre,
      gmail,
      password: hashedPassword,
      nombreArtista: nombreArtista || nombre,
      role
    });

    const token = this._generateToken(newUser);

    return {
      user: {
        id: newUser._id,
        nombre: newUser.nombre,
        gmail: newUser.gmail,
        nombreArtista: newUser.nombreArtista,
        role: newUser.role
      },
      token
    };
  }

  async login(gmail, password) {
    // 1. Buscar usuario incluyendo el password
    const user = await userRepository.findByGmail(gmail, true);
    if (!user) {
      throw { statusCode: 401, message: 'Credenciales inválidas' };
    }

    // 2. Comparar contraseñas
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw { statusCode: 401, message: 'Credenciales inválidas' };
    }

    // 3. Generar token
    const token = this._generateToken(user);

    return {
      user: {
        id: user._id,
        nombre: user.nombre,
        gmail: user.gmail,
        nombreArtista: user.nombreArtista,
        role: user.role
      },
      token
    };
  }

  _generateToken(user) {
    return jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
}

module.exports = new AuthService();