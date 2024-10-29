/**
 * db.js
 * 
 * Este archivo gestiona la conexión y las operaciones con la base de datos PostgreSQL. Se conecta a la base de datos y permite realizar funciones CRUD(Crear,Leer,Actualizar y Eliminar)
 * 
 * 
 * FUNCIONES PRINCIPALES:
 * - "conectar" : Establece la conexión a la base de datos utilizando las variables de entorno
 * - "traerUsuarios" : Recupera todos los usuarios de la tabla "usuarios"
 * - "registrarUsuario" : Inserta un nuevo usuario en la base de datos
 * - "borrarLibro" : Elimina un libro de la tabla libros seún su ID
 * - "traerLibros" : Obtiene los libros de una usuario específico
 * - "nuevoLibro" : Inserta un nuevo libro en la base de datos que va asociado a un usuario concreto
 * 
 * 
 * Todas las operaciones están estructuradas para manejar errores y cerrar las conexiones, una vez completada la consulta
 */



//Importamos Postgres para manejar conexiones con la base de datos hecha en Postgres
import postgres from "postgres";
//Importamos dotenv para cargar variables de entorno desde el archivo.env
import  dotenv  from "dotenv";

//Carga las variables de entorno
dotenv.config();

/**
 * Función que sirve para establecer una conexión con la base de datos en PostgreSQL
 * @returns {object} Configuración de la conexión a PostgreSQL
 */
function conectar(){
    return postgres({
        host : process.env.DB_HOST,
        database : process.env.DB_NAME,
        user : process.env.DB_USER,
        password : process.env.DB_PASSWORD,
        
    });
}


/**
 * traerUsuarios
 * 
 * Función asíncrona que obtiene la lista de usuarios de la base de datos
 * @returns {Promesa} Devuelve una promesa que se resuelve con un array que contiene los usuarios 
 */
export function traerUsuarios(){
    return new Promise(async (ok,ko) => {
        
        const conexion = conectar();
        
        try{
            
            let usuarios = await conexion`SELECT * FROM usuarios`;
            
            conexion.end();
        
            ok(usuarios);
            console.log("se han traido los usuarios");

        }catch(error){

            console.error("Error al traer a los usuarios de la base de datos:", error);
            ko({ error: error.message || "error en la base de datos" });
            
        }

    });   
}


//Esta funcion daba muchos problemas así que está corregida en su totalidad por chatGPT
/**
 * 
 * checkUsuario
 * 
 * Esta función asíncrona verifica si un usuario existe en la base de datos 
 * @param {string} email - El email que se va a verificar
 * @returns {Promesa} Devuelve una promesa que se resuelve con un objeto con la informacion del usuario o Null
 */
export async function checkUsuario(email) {
    const conexion = conectar();
    try{

        //Para hacer un seguimiento de la ejecución
        console.log("Consultando usuario con email:", email);

        //La consulta devuelve un array con el usuario encontrado o por el contrario un array vacío si no hay coincidencia, para poder utilizarlo en la ruta de registro para comprobar si el usuario a registrar ya existía
        let usuarioExistente = await conexion`SELECT * FROM usuarios WHERE email = ${email}`;

        console.log("Resultado de consulta en checkUsuario:", usuarioExistente);
        return usuarioExistente;

    } catch(error){

        console.error("Error en la verificacion de datos del usuario:", error);
        ko({ error: error.message || "error en la base de datos" });

    }finally{

        conexion.end(); 
    }
}
    


//Esta funcion para gestionar los datos del login está respaldada por inteligencia artificial (chatGPT), en concreto esta no está apenas construida con IA pero si ha servido de ayuda para la implementación del login y registro
/**
 * 
 * registrarUsuario
 * 
 * 
 *Esta función asíncrona inserta un nuevo usuario en la base de datos con los datos proporcionados en los parámetros de la función
 * @param {string} nombre - El email que se va a verificar 
 * @param {string} email - El email que se va a verificar
 * @param {string} hashedPassword - El email que se va a verificar
 * @returns {Promesa} Devuelve una promesa que se resuelve con el ID del usuario 
 */
export function registrarUsuario(nombre,email,hashedPassword){
    return new Promise(async (ok,ko) => {
        
        const conexion = conectar();
        
        try{
            
            let [{id}] = await conexion`INSERT INTO usuarios (name, email, password) VALUES (${nombre},${email},${hashedPassword}) RETURNING id`;
            
            conexion.end();
        
            ok(id);
            console.log("Usuario Registrado")

        }catch(error){
            console.error("Error al registrar el usuario en la base de datos:", error);
            ko({ error: error.message || "error en la base de datos" });
        }

    });   
}




/**
 * 
 * traerLibros
 * 
 * Esta función asíncrona nos devuelve los libros de la tabla libros de la base de datos
 * @param {number} usuario_id - El numero de usuario que está vinculado al id de la tabla usuarios
 * @returns {Promesa} Devuelve una promesa que se resuelve devolviendo un array con los libros, almacenados según usuario_id
 */
export function traerLibros(usuario_id){
    return new Promise(async (ok,ko) => {
            
            const conexion = conectar();
           
            try{
                
                let libros = await conexion`SELECT * FROM libros WHERE usuario_id = ${usuario_id}`;
                
                conexion.end();
            
                ok(libros);
                console.log("se han traido los libros en función del usuario que ha iniciado sesión")
    
            }catch(error){
                console.error("Error al traer los libros de la base de datos:", error);
                ko({ error: error.message || "error en la base de datos" });

            }
    
        });   
    }



/**
 * nuevoLibro
 * 
 * Esta función asíncrona nos devuelve los libros de la tabla libros de la base de datos
 * @param {number} usuario_id - El numero de usuario que está vinculado al id de la tabla usuarios que vamos a introducir en la base de datos
 * @param {string} titulo - El titulo del libro que vamos a introducir en la base de datos
 * @param {string} opinion - La opinion sobre el libro que vamos a introducir en la base de datos
 * @param {string} tematica - La temática sobre el libro que vamos a introducir en la base de datos
 * @param {string} progreso - El progreso del libro que vamos a introducir en la base de datos
 * @param {number} puntuacion - La puntuación sobre el libro que vamos a introducir en la base de datos
 * @returns {Promesa} Devuelve una promesa que se resuelve devolviendo un array con los libros, almacenados según usuario_id
 */
export function nuevoLibro(usuario_id,titulo,opinion,tematica,progreso,puntuacion){
    
    return new Promise(async (ok,ko) => {
        
        const conexion = conectar();
        
        try{
            console.log("Intentando insertar un libro con los datos:", {
                usuario_id,
                titulo,
                opinion,
                tematica,
                progreso,
                puntuacion, 
            });


            let resultado = await conexion`INSERT INTO libros (usuario_id, titulo, opinion, tematica, progreso, puntuacion) VALUES (${usuario_id}, ${titulo}, ${opinion}, ${tematica}, ${progreso}, ${puntuacion}) 
            RETURNING id`;

            conexion.end();

            console.log("Libro insertado con exito", resultado[0].id);
            ok(resultado[0].id);
        }catch(error){
           
            console.error("Error al añadir el libro a la base de datos:", error);
            ko({ error: error.message || "error en la base de datos" });
        }

    });   
}


/**
 *Esta función asíncrona inserta un nuevo usuario en la base de datos con los datos proporcionados en los parámetros de la función
 * @param {number} id - El id del libro que queremos borrar
 * @returns {Promesa} Devuelve una promesa que se resuelve con count que es el número de registros afectados 
 */
export function borrarLibro(id){
   
    return new Promise(async (ok,ko) => {
 
        const conexion = conectar();
   
        try{
         
            let {count} = await conexion`DELETE FROM libros WHERE id = ${id}`;

            conexion.end();

            ok(count);
        }catch(error){
            console.error("Error al borrar el libro en la base de datos:", error);
            ko({ error: error.message || "error en la base de datos" });
        }

    });   
}


//Aqui tambien me he apoyado la inteligencia artificial (CHATGPT) ya que me estaba dando muchos errores a la hora de la inserción de datos SQL en la base de datos 
/**
 * 
 * actualizarLibro
 * 
 *Esta función asíncrona actualiza los datos de un libro almacenado en la base de datos
 * @param {number} id - El id del libro que queremos actualizar
 * @param {Object} elementosActualizados - Es un objeto con las propiedades y valores que queremos actualizar
 * @returns {Promesa} Devuelve una promesa que se resuelve con true si se actualizó al menos un elemento, o false si no se actualizó nada 
 */
export function actualizarLibro(id,elementosActualizados){
    return new Promise(async (ok,ko) => {
        
        const conexion = conectar();
        const actualizaciones = Object.keys(elementosActualizados);
        const valores = Object.values(elementosActualizados);
        try{
           
            if(!elementosActualizados || actualizaciones.length === 0){
                return ok(false);
            }

            
            //Determinamos el SET para la posterior consulta SQL dinámicamente para cada campo
            const setClause = actualizaciones.map((campo, index) => `${campo} = $${index + 1}`).join(", ");


            //Añade el id al final para utilizarlo en el WHERE
            valores.push(id);

            //Comprobaciones para el correcto funcionamiento 
            console.log("Valores:", valores);

            

            //Termine utilizando .unsafe(porque era la única manera en que aceptaba la inserción de SQL)
            const resultado = await conexion.unsafe(`
                UPDATE libros
                SET ${setClause}
                WHERE id = $${valores.length}
              `, valores);

            conexion.end();

            //Devuelve true si al menos un registro fue afectado
            ok(resultado.count > 0);

        }catch(error){
            console.error("Error al actualizar el libro en la base de datos:", error);
            ko({ error: error.message || "error en la base de datos" });
        }
    });
}


 
