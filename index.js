import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";
import { traerLibros,traerUsuarios,checkUsuario,registrarUsuario } from "./db.js";

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
  
    try {
     
        let usuarioExistente = await checkUsuario(peticion.body.email);
        if (usuarioExistente.rows.length > 0) {
            return respuesta.json({ message: 'El usuario ya existe' });
        }
    
        
        let hashedPassword = await bcrypt.hash(peticion.body.password, 10);
    
        let nuevoUsuario= await registrarUsuario(peticion.body.name,peticion.body.email,hashedPassword)
    
        respuesta.json({ message: 'Usuario registrado correctamente', user: nuevoUsuario.rows[0] });
    }catch (error) {
        respuesta.status(500)
        respuesta.json({ error: 'Error al registrar usuario' });
    }
});



servidor.post('/api/login', async (peticion, respuesta) => {
  
    try {
     
        let usuarioExistente = await checkUsuario(peticion.body.email);
        if (usuarioExistente.length === 0) {
            return respuesta.json({ message: 'El usuario no existe' });
        }
    
        let usuario = usuarioExistente[0];
        
        let passwordCorrecta = await bcrypt.compare(peticion.body.password, usuario.password);
        if(!passwordCorrecta){
            return respuesta.json({ message: "Contraseá incorrecta"})
        }

        let token = jwt.sign(
            { id: usuario.id, email: usuario.email},
            process.env.JWT_SECRET,
            { expiresIn : "1h"}
        );
    
        respuesta.json({message:"Sesión iniciada con éxito",token, user: { id: usuario.id, name: usuario.name, email:usuario.email}
        });

    }catch (error) {
        respuesta.status(500)
        respuesta.json({ error: 'Error al iniciar sesion' });
    }
});



servidor.use((error,peticion,respuesta,siguiente) => {
        respuesta.status(400);
        respuesta.json({ error : "error en la petición" });
})

servidor.use((peticion,respuesta) => {
        respuesta.status(404);
        respuesta.json({ error : "error recurso no encontrado" });
}) 

servidor.listen(process.env.PORT, () => {
        console.log("Servidor escuchando por el puerto 3000");
});