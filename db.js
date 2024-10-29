import postgres from "postgres";
import  dotenv  from "dotenv";

dotenv.config();

function conectar(){
    return postgres({
        host : process.env.DB_HOST,
        database : process.env.DB_NAME,
        user : process.env.DB_USER,
        password : process.env.DB_PASSWORD,
        
    });
}



export function traerUsuarios(){
    return new Promise(async (ok,ko) => {
        
        const conexion = conectar();
        
        try{
            
            let usuarios = await conexion`SELECT * FROM usuarios`;
            
            conexion.end();
        
            ok(usuarios);
            console.log("se han traido los usuarios")

        }catch(error){
            
            ko({ error: "error en la base de datos" });
        }

    });   
}

/* export function checkUsuario(email){
    return new Promise(async (ok,ko) => {
        const conexion = conectar();
        try{
           
            let usuarioExistente = await conexion`SELECT * FROM usuarios WHERE email = ${email}`;

            conexion.end();

            if(usuarioExistente.length > 0) {
                console.log("Usuario existente en la base de datos", usuarioExistente);
                ok(usuarioExistente);
            }else{
                console.log("No se encontró ningún usuario con el email:", email);
                return [];
            }
         

        }catch(error){
           console.error("Error en la verificacion del usuario", error);
            ko({ error: "error en la base de datos" });
        }

    });   
} */

export async function checkUsuario(email) {
    const conexion = conectar();
    try {
            console.log("Consultando usuario con email:", email);
            let usuarioExistente = await conexion`SELECT * FROM usuarios WHERE email = ${email}`;
            console.log("Resultado de consulta en checkUsuario:", usuarioExistente);
            return usuarioExistente;
    } catch (error) {
            console.error("Error en la verificación del usuario:", error);
            throw new Error("Error en la base de datos");
    } finally {
            conexion.end(); 
    }
}
    


export function registrarUsuario(nombre,email,hashedPassword){
    return new Promise(async (ok,ko) => {
        
        const conexion = conectar();
        
        try{
            
            let [{id}] = await conexion`INSERT INTO usuarios (name, email, password) VALUES (${nombre},${email},${hashedPassword}) RETURNING id`;
            
            conexion.end();
        
            ok(id);
            console.log("Usuario Registrado")

        }catch(error){

            ko({ error: "error en la base de datos" });
        }

    });   
}


/* export function traerLibros(){
    return new Promise(async (ok,ko) => {
        
        const conexion = conectar();
       
        try{
            
            let libros = await conexion`SELECT * FROM libros`;
            
            conexion.end();
        
            ok(libros);
            console.log("se han traido los libros")

        }catch(error){
            ko({ error: "error en la base de datos" });
        }

    });   
} */


    export function traerLibros(usuario_id){
        return new Promise(async (ok,ko) => {
            
            const conexion = conectar();
           
            try{
                
                let libros = await conexion`SELECT * FROM libros WHERE usuario_id = ${usuario_id}`;
                
                conexion.end();
            
                ok(libros);
                console.log("se han traido los libros en función del usuario que ha iniciado sesión")
    
            }catch(error){
                ko({ error: "error en la base de datos" });
            }
    
        });   
    }

        /* export function traerLibros(usuario_id,busqueda){
            return new Promise(async (ok,ko) => {
                
                const conexion = conectar();

               
                try{

                    let libros = [];
                    
                    let minusculaBusqueda = busqueda.toLowerCase();
                       
                    if(busqueda){
                        libros= await conexion`SELECT * FROM libros WHERE usuario_id = ${usuario_id} AND LOWER(titulo) LIKE ${minusculaBusqueda}`;
                    }else{
                        libros = await conexion`SELECT * FROM libros WHERE usuario_id = ${usuario_id}`;
                    }
                    
                    
                    conexion.end();
                
                    ok(libros);
                    console.log("se han traido los libros en función del usuario que ha iniciado sesión")
        
                }catch(error){
                    ko({ error: "error en la base de datos" });
                }
        
            });   
        } */



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
           
            ko({ error: "error en la base de datos" });
        }

    });   
}

export function borrarLibro(id){
   
    return new Promise(async (ok,ko) => {
 
        const conexion = conectar();
   
        try{
         
            let {count} = await conexion`DELETE FROM libros WHERE id = ${id}`;

            conexion.end();

            ok(count);
        }catch(error){
          
            ko({ error: "error en la base de datos" });
        }

    });   
}

export function actualizarLibro(id,elementosActualizados){
    return new Promise(async (ok,ko) => {
        
        const conexion = conectar();
        const actualizaciones = Object.keys(elementosActualizados);
        const valores = Object.values(elementosActualizados);
        try{
           
            if(!elementosActualizados || actualizaciones.length === 0){
                return ok(false);
            }

            

            const setClause = actualizaciones.map((campo, index) => `${campo} = $${index + 1}`).join(", ");


            valores.push(id);

            console.log("Valores:", valores);

            

            
            const resultado = await conexion.unsafe(`
                UPDATE libros
                SET ${setClause}
                WHERE id = $${valores.length}
              `, valores);

            conexion.end();

            ok(resultado.count > 0);

        }catch(error){
            console.error("Error al actualizar el libro en la base de datos:", error);
            ko({ error: error.message || "error en la base de datos" });
        }
    });
}


 
