import express from "express";
// import cors from "cors";
import dotenv from "dotenv";
import cors from "cors";
import { traerLibros,traerUsuarios } from "./db.js";

dotenv.config();

const servidor = express();

servidor.use(cors());

servidor.use(express.json());


servidor.get("/api/usuarios", async (peticion,respuesta) => {
    try{
        let usuarios = await traerUsuarios();
        respuesta.json(usuarios);
    }catch(error){
        respuesta.status(500);
        respuesta.json({ error : "error en el servidor"});
    }
});

servidor.get("/api/libros", async (peticion,respuesta) => {
    try{
        let libros = await traerLibros();
        respuesta.json(libros);
    }catch(error){
        respuesta.status(500);
        respuesta.json({ error : "error en el servidor"});
    }
});


servidor.post('/api/registro', async (peticion, respuesta) => {
    const { name, email, password } = peticion.body;
  
    try {
      // Verificar si el usuario ya existe
      const userExists = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
      if (userExists.rows.length > 0) {
        return res.status(400).json({ message: 'El usuario ya existe' });
      }
  
      // Hashear la contraseña antes de guardar
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Insertar el nuevo usuario en la base de datos
      const newUser = await pool.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
        [name, email, hashedPassword]
      );
  
      res.status(201).json({ message: 'Usuario registrado correctamente', user: newUser.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al registrar usuario' });
    }
  });




servidor.listen(process.env.PORT, () => {
    console.log("Servidor escuchando por el puerto 3000");
});