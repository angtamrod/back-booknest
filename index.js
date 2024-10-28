import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";
import { traerLibros,nuevoLibro,borrarLibro,traerUsuarios,checkUsuario,registrarUsuario,actualizarLibro } from "./db.js";

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



servidor.post("/api/registro", async (peticion, respuesta) => {
    
    console.log("Solicitud recibida en /api/registro:", peticion.body);

    let { nombre, email, password } = peticion.body;

        if(!nombre || !email || !password){
            return respuesta.status(400).json({ message: "Faltan campos obligatorios" });
        }

        try {
            
            console.log("Verificando si el usuario existe:", email);
                let usuarioExistente = await checkUsuario(email);
            console.log("Resultado de checkUsuario:", usuarioExistente);

                if(usuarioExistente.length > 0){
                        console.log("El usuario ya existe con el email:", email);

                        return respuesta.status(409).json({ message: "El usuario ya existe" });
                    } 

        
            console.log("Generando hash de la contraseña");
                let hashedPassword = await bcrypt.hash(password, 10);
            console.log("Hash generado:", hashedPassword);

            
            console.log("Registrando nuevo usuario en la base de datos:", { nombre, email });
                let nuevoUsuarioId = await registrarUsuario(nombre, email, hashedPassword);
            console.log("Nuevo usuario registrado. ID:", nuevoUsuarioId);

        
                respuesta.status(201).json({
                    message: "Usuario registrado correctamente",
                    user: { id: nuevoUsuarioId, nombre, email }
                });

            console.log("Respuesta enviada al cliente con éxito");

        }catch(error){
            console.error("Error al registrar usuario:", error);
            respuesta.status(500).json({ error: "Error al registrar usuario" });
        }
});




servidor.post("/api/login", async (peticion, respuesta) => {
   
    console.log(peticion.body);

    const { email, password } = peticion.body;

    try {
     
        let usuarioExistente = await checkUsuario(email);
            if (usuarioExistente.length === 0) {
                return respuesta.json({ message: "El usuario no existe" });
            }
    
        let usuario = usuarioExistente[0];
        console.log("Usuario encontrado" , usuario);
        
        let passwordCorrecta = await bcrypt.compare(password, usuario.password);

            if(!passwordCorrecta){
                return respuesta.json({ message: "Contraseña incorrecta"})
            }

            if(!process.env.JWT_SECRET){
                return respuesta.status(500).json({ error: "Configuracion del servidor incorrecta, falta JWT_SECRET"})
            }

        let token = jwt.sign(
            { id: usuario.id, email: usuario.email},
            process.env.JWT_SECRET,
            { expiresIn : "1h"}
        );
    
            respuesta.json({message:"Sesión iniciada con éxito", token, user: { id: usuario.id, name: usuario.name, email:usuario.email}
            });
        console.log("sesion iniciada con exito para el usuario", usuario.email);

    }catch(error){
        respuesta.status(500)
        respuesta.json({ error: "Error al iniciar sesion" });
    }
});

/* servidor.get("/api/libros", async (peticion,respuesta) => {
    try{
        let libros = await traerLibros();
        respuesta.json(libros);
    }catch(error){
        respuesta.status(500);
        respuesta.json({ error : "error en el servidor"});
    }
}); */

servidor.get("/api/libros/:usuario_id([0-9]+)", async (peticion,respuesta) => {
    const usuario_id = peticion.params.usuario_id;
    try{
        let libros = await traerLibros(usuario_id);
        respuesta.json(libros);
    }catch(error){
        respuesta.status(500);
        respuesta.json({ error : "error en el servidor"});
    }
});

servidor.post("/api/libros/nuevo", async (peticion,respuesta,siguiente) => {

    console.log("Solicitud recibida para /api/libros/nuevo:", peticion.body);

    let { usuario_id,titulo,opinion,tematica,progreso,puntuacion } = peticion.body; 

    if(usuario_id && usuario_id.trim() != "" &&
       titulo && titulo.trim() != "" && 
       opinion && opinion.trim() != "" && 
       tematica && tematica.trim() != "" && 
       progreso && progreso.trim() != ""){
        try{
            let id = await nuevoLibro(usuario_id, titulo, opinion, tematica, progreso, puntuacion);
          
            respuesta.status(201);
            return respuesta.json({id});
        }catch(error){
            respuesta.status(500);
            console.log("error")
            return respuesta.json({ error : "error en el servidor" }) //
        }
    }

    siguiente({ error : "faltan campos obligatorios" });

});



servidor.delete("/api/libros/borrar/:id([0-9]+)", async (peticion,respuesta) => {
    
    console.log(peticion.params.id);

    try{

        let cantidad= await borrarLibro(peticion.params.id);
        respuesta.json({ resultado : cantidad ? "ok" : "ko"});

    }catch(error){

        respuesta.status(500);
        respuesta.json({ error : "error en el servidor"});

    }
});




servidor.put("/api/libros/actualizar/:id([0-9]+)", async (peticion, respuesta, siguiente) => {
    
    console.log(peticion.params.id);
    console.log(peticion.body)

    let id = peticion.params.id;
    let elementosActualizados = peticion.body;
  
    if (Object.keys(elementosActualizados).length === 0) {
        return siguiente({ error: "No se han proporcionado campos para actualizar" });
    }
  
    try {
      let cantidad = await actualizarLibro(id,elementosActualizados);
      respuesta.json({ resultado: cantidad ? "ok" : "ko" });
    } catch (error) {
      console.error("Error al actualizar el libro", error);
      respuesta.status(500).json({ error: "Error en el servidor al actualizar el libro" });
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


