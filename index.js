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


servidor.get("/api/usuarios", async (peticion,respuesta,siguiente) => {
    
    try{
        let usuarios = await traerUsuarios();
        respuesta.status(200).json(usuarios);

    }catch(error){
        console.log(error);
        siguiente(error);
        /* respuesta.status(500);
        respuesta.json({ error : "error en el servidor"}); */
    }
});



servidor.post("/api/registro", async (peticion,respuesta,siguiente) => {
    
    console.log("Solicitud recibida en /api/registro:", peticion.body);

    let { nombre, email, password } = peticion.body;

    if(!nombre || !email || !password){
             return respuesta.status(400).json({ message: "Faltan campos obligatorios" });
    }

        try {
            
            console.log("Verificando si el usuario existe:", email);
            let usuarioExistente = await checkUsuario(email);

            if(usuarioExistente && usuarioExistente.length > 0){
                return respuesta.status(409).json({ message: "El usuario ya existe" });
            }
            let hashedPassword = await bcrypt.hash(password, 10);
            console.log("Hash generado:", hashedPassword);

            
            console.log("Registrando nuevo usuario en la base de datos:", { nombre, email });
            let nuevoUsuarioId = await registrarUsuario(nombre, email, hashedPassword);
            
        
            respuesta.status(200).json({
                 message: "Usuario registrado correctamente",
                 user: { id: nuevoUsuarioId, nombre, email }
            });
            console.log("Respuesta enviada al cliente con éxito");
  
            
        }catch(error){
            console.log(error);
            /*respuesta.status(500).json({ error: "Error al registrar usuario" }); */
            siguiente(error);
        }
}); 






servidor.post("/api/login", async (peticion, respuesta,siguiente) => {
   
    console.log(peticion.body);

    const { email, password } = peticion.body;

    if( !email || !password){
        return respuesta.status(400).json({ message: "Faltan campos obligatorios" });
    }

    try {
     
        let usuarioExistente = await checkUsuario(email);
            if (usuarioExistente.length === 0) {
                return respuesta.status(404).json({ message: "El usuario no existe" });
            }
    
        let usuario = usuarioExistente[0];
        console.log("Usuario encontrado" , usuario);
        
        let passwordCorrecta = await bcrypt.compare(password, usuario.password);

            if(!passwordCorrecta){
                return respuesta.status(401).json({ message: "Contraseña incorrecta"})
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
        
    }catch(error){
        console.log(error);
        siguiente(error);
        /* respuesta.status(500)
        respuesta.json({ error: "Error al iniciar sesion" }); */
    }
});


servidor.get("/api/libros", async (peticion,respuesta,siguiente) => {
    try{
        let libros = await traerLibros();
        respuesta.json(libros);
    }catch(error){
        console.log(error);
        siguiente(error);
        /* respuesta.status(500);
        respuesta.json({ error : "error en el servidor"}); */
    }
}); 

/* servidor.get("/api/libros/:usuario_id([0-9]+)", async (peticion,respuesta) => {
    const usuario_id = peticion.params.usuario_id;
    try{
        let libros = await traerLibros(usuario_id);
        respuesta.status(200);
        respuesta.json(libros);
    }catch(error){
        respuesta.status(500);
        respuesta.json({ error : "error en el servidor"});
    }
}); */

servidor.get("/api/libros/:usuario_id([0-9]+)", async (peticion,respuesta,siguiente) => {
    const usuario_id = peticion.params.usuario_id;
    try{
        let libros = await traerLibros(usuario_id);
        respuesta.status(200).json(libros);
    }catch(error){
        console.log(error);
        siguiente(error);
        /* respuesta.status(500).json({ error : "error en el servidor"}); */
    }
});



servidor.post("/api/libros/nuevo", async (peticion,respuesta,siguiente) => {

    console.log("Nuevo libro:", peticion.body);

    let { usuario_id,titulo,opinion,tematica,progreso,puntuacion } = peticion.body; 

    if(usuario_id && usuario_id.trim() != "" &&
       titulo && titulo.trim() != "" && 
       opinion && opinion.trim() != "" && 
       tematica && tematica.trim() != "" && 
       progreso && progreso.trim() != ""){
        try{
            let id = await nuevoLibro(usuario_id, titulo, opinion, tematica, progreso, puntuacion);
          
            respuesta.status(200).json({id});

        }catch(error){
            console.log(error);
            siguiente(error);
           /*  respuesta.status(500);
            console.log("error")
            return respuesta.json({ error : "error en el servidor" }) */ 
        }
    }


}); 





servidor.delete("/api/libros/borrar/:id([0-9]+)", async (peticion,respuesta,siguiente) => {
    
    console.log(peticion.params.id);

    try{

        let cantidad= await borrarLibro(peticion.params.id);
        respuesta.json({ resultado : cantidad ? "ok" : "ko"});

    }catch(error){
        console.log(error);
        siguiente(error);
        /* respuesta.status(500);
        respuesta.json({ error : "error en el servidor"}); */

    }
});




servidor.put("/api/libros/actualizar/:id([0-9]+)", async (peticion, respuesta, siguiente) => {
    
    console.log(peticion.params.id);
    console.log(peticion.body)

    let id = peticion.params.id;
    let elementosActualizados = peticion.body;
  
    if (Object.keys(elementosActualizados).length === 0) {
        return respuesta.status(400).json({ message: "Faltan campos obligatorios" });
    }
  
    try {
      let cantidad = await actualizarLibro(id,elementosActualizados);
      respuesta.json({ resultado: cantidad ? "ok" : "ko" });
    } catch(error) {
        console.log(error);
        siguiente(error);
      /* console.error("Error al actualizar el libro", error);
      respuesta.status(500).json({ error: "Error en el servidor al actualizar el libro" }); */
    }
  });



servidor.use((error,peticion,respuesta,siguiente) => {
        console.error("Error al validar", error.message)
        return respuesta.status(400).json({ error : "Faltan campos obligatorios" });
})

servidor.use((error,peticion,respuesta,siguiente) => {
    console.error("Error en la peticion del usuario", error.message)
    return respuesta.status(404).json({ error : "Recurso no encontrado" });
})


servidor.use((error,peticion,respuesta,siguiente) => {
    console.error("Error de conflicto", error.message)
    return respuesta.status(409).json({ error : "El usuario ya existe" });
}) 

servidor.use((error,peticion,respuesta,siguiente) => {
    console.error("Error interno del servidor", error.message)
    return respuesta.status(500).json({ error : "Error interno del servidor" });
}) 

servidor.listen(process.env.PORT, () => {
        console.log("Servidor escuchando por el puerto 3000");
});


