/**
 * index.js
 * 
 * Este archivo es el punto de entrada principal del servidor Express. En concreto configura y maneja las rutas para interactuar con la base de datos en PostgreSQL, con funciones definidas en db.js, para realizar las distintas operaciones con la tabla usuarios y la tabla libros. También configura middlewares para manejar CORS, parsear JSON y la gestión de la autenticación de usuarios con jsonwebtoken
 * 
 * 
 * FUNCIONES PRINCIPALES:
 * - Rutas para CRUD con la tabla usuarios y libros
 * - Autenticación con JWT para la protección de rutas
 * - Uso de bcrypt para proteger las contraseñas
 * 
 * MIDDELWARES UTILIZADOS:
 * - "cors": Permite el acceso a la API desde otros dominios
 * - "express.json()" : Permite la lectura del JSON
 */


//Importaciones para poder configurar el servidor y manejar las rutas y las operaciones de la base de datos
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";
import { traerLibros,nuevoLibro,borrarLibro,traerUsuarios,checkUsuario,registrarUsuario,actualizarLibro } from "./db.js";

dotenv.config();//Carga las variables de entorno desde el archivo.env

const servidor = express();

//Middleware de cors para permitir solicitudes desde otros dominios
servidor.use(cors());

//Middleware que permite parsear JSON en el cuerpo de la solicitud
servidor.use(express.json());


/**
 * GET /api/usuarios
 * Recupera todos los usuarios de la base de datos
 * @returns {Array} con la lista de usuarios
 */
servidor.get("/api/usuarios", async (peticion,respuesta,siguiente) => {
    
    try{
        let usuarios = await traerUsuarios();
        respuesta.status(200).json(usuarios);

    }catch(error){
        console.log(error);
        siguiente(error);
    }
});


//En lo relativo al registro me he apoyado en la IA para implementar, ya que había elementos que no dominaba como bcrypt
/**
 * POST /api/registro
 * Registra un nuevo usuario en la base de datos con una contraseña cifrada
 * @param {string} nombre - Nombre del usuario
 * @param {string} email - Correo electrónico del usuario del usuario
 * @param {string} password - Contraseña del usuario del usuario
 * @returns {Object} Con la información del usuario registrado o devuelve un error
 */
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
            siguiente(error);
        }
}); 



//En lo relativo al login me he apoyado en la IA para implementar, ya que había elementos que no dominaba como bcrypt o JWT que no dominaba
/**
 * POST /api/login
 * Verifica los datos del usuario y genera un token JWT si son correctos
 * @param {string} nombre - Nombre del usuario
 * @param {string} email - Correo electrónico del usuario del usuario
 * @returns {Object} Con el token JWT o un mensaje de error
 */
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
    }
});


/**
 * GET /api/libros
 * Recupera todos los libros de la base de datos
 * @returns {Array} con la lista de libros
 */
servidor.get("/api/libros", async (peticion,respuesta,siguiente) => {
    try{
        let libros = await traerLibros();
        respuesta.json(libros);
    }catch(error){
        console.log(error);
        siguiente(error);
        
    }
}); 




/**
 * GET /api/libros/:usuario_id
 * Recupera todos los de la base de datos según usuario_id
 * @param {number} usuario_id - El usuario_id para devolver los libros en función del usuario_id que los haya añadido
 * @returns {Array} con la lista de libros según el usuario_id que los haya añadido
 */
servidor.get("/api/libros/:usuario_id([0-9]+)", async (peticion,respuesta,siguiente) => {
    const usuario_id = peticion.params.usuario_id;
    try{
        let libros = await traerLibros(usuario_id);
        respuesta.status(200).json(libros);
    }catch(error){
        console.log(error);
        siguiente(error);
    }
});


/**
 * POST /api/libros/nuevo
 * Agrega un nuevo libro a la base de datos
 * @param {number} usuario_id - El numero de usuario que está vinculado al id de la tabla usuarios
 * @param {string} titulo - El titulo del libro 
 * @param {string} opinion - La opinion sobre el libro 
 * @param {string} tematica - La temática del libro 
 * @param {string} progreso - El progreso de lectura del libro
 * @param {number} puntuacion - Puntuación del usuairo sobre el libro 
 * @returns {Promise} Devuelve una promesa con una respuesta JSON con el id del nuevo libro o un mensaje de error
 */
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
        }
    }

}); 




/**
 * DELETE /api/libros/borrar/:id
 * Elimina un libro de la base de datps según el id proporcionado
 * @param {number} id - El id del libro a eliminar
 * @returns {Object} Mensaje que confirma la eliminación o el error
 */
servidor.delete("/api/libros/borrar/:id([0-9]+)", async (peticion,respuesta,siguiente) => {
    
    console.log(peticion.params.id);

    try{

        let cantidad= await borrarLibro(peticion.params.id);
        respuesta.json({ resultado : cantidad ? "ok" : "ko"});

    }catch(error){
        console.log(error);
        siguiente(error);

    }
});


//En lo relativo a la gestión de actualizacion me he apoyado en la IA ya que me costaba gestionar la actualización de múltiples campos y valores, la idea principal la tenía pero me abrió el camino para poder implementarlo
/**
 * PUT /api/libros/actualizar/:id
 * Actualiza los detalles de un libro ya existente en la base de datos
 * @param {number} id - El id del libro a actualizar
 * @param {Object} elementosActualizados - Objeto que contiene los valores y los campos que se quieren actualizar
 * @returns {Object} Mensaje que confirma la eliminación o el error
 */
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
    }
  });


/**
 * Middleware manejo de error 400
 * @param {Error} error - Objeto de error capturado
 * @param {Request} peticion - Objeto de solictud HTTP
 * @param {Response} respuesta - Objeto de respuesta HTTP
 * @param {Function} siguiente - Llama al siguiente middleware de la cadena
 * @returns {Response} respuesta JSON - con el mensaje de error de validación
 */
servidor.use((error,peticion,respuesta,siguiente) => {
        console.error("Error al validar", error.message)
        return respuesta.status(400).json({ error : "Faltan campos obligatorios" });
})


/**
 * Middleware manejo de error 404
 * @param {Error} error - Objeto de error capturado
 * @param {Request} peticion - Objeto de solictud HTTP
 * @param {Response} respuesta - Objeto de respuesta HTTP
 * @param {Function} siguiente - Llama al siguiente middleware de la cadena
 * @returns {Response} respuesta JSON - con el mensaje de error de Recurso no encontrado
 */
servidor.use((error,peticion,respuesta,siguiente) => {
    console.error("Error en la peticion del usuario", error.message)
    return respuesta.status(404).json({ error : "Recurso no encontrado" });
})


/**
 * Middleware manejo de error 409
 * @param {Error} error - Objeto de error capturado
 * @param {Request} peticion - Objeto de solictud HTTP
 * @param {Response} respuesta - Objeto de respuesta HTTP
 * @param {Function} siguiente - Llama al siguiente middleware de la cadena
 * @returns {Response} respuesta JSON - con el mensaje de error de conflicto
 */
servidor.use((error,peticion,respuesta,siguiente) => {
    console.error("Error de conflicto", error.message)
    return respuesta.status(409).json({ error : "El usuario ya existe" });
}) 



/**
 * Middleware manejo de error 500
 * @param {Error} error - Objeto de error capturado
 * @param {Request} peticion - Objeto de solictud HTTP
 * @param {Response} respuesta - Objeto de respuesta HTTP
 * @param {Function} siguiente - Llama al siguiente middleware de la cadena
 * @returns {Response} respuesta JSON - con el mensaje de error interno del servidor
 */
servidor.use((error,peticion,respuesta,siguiente) => {
    console.error("Error interno del servidor", error.message)
    return respuesta.status(500).json({ error : "Error interno del servidor" });
}) 



servidor.listen(process.env.PORT, () => {
        console.log("Servidor escuchando por el puerto 3000");
});


