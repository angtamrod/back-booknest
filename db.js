import postgres from "postgres";
import  dotenv  from "dotenv";

dotenv.config();

function conectar(){
    return postgres({
        host : process.env.DB_HOST,
        database : process.env.DB_NAME,
        user : process.env.DB_USER,
        password : process.env.DB_PASSWORD
    });
}



export function traerUsuarios(){
    return new Promise(async (ok,ko) => {
        
        const conexion = conectar();
        
        try{
            /*2. Ejecuta una consulta SQL SELECT * FROM tareas para obtener todos los registros de la tabla tareas.
                 Utiliza await para esperar el resultado de la consulta, que devuelve un array de objetos representando cada tarea.
            */
            let usuarios = await conexion`SELECT * FROM usuarios`;
            
            conexion.end();
        
            ok(usuarios);
            console.log("se han traido los usuarios")

        }catch(error){
            //5. Si ocurre un error, lo maneja con ko({ error: "error en la base de datos" }).
            ko({ error: "error en la base de datos" });
        }

    });   
}

export function checkUsuario(){
    return new Promise(async (ok,ko) => {
        const conexion = conectar();
        try{
           
            let usuarioExistente = await conexion`SELECT * FROM usuarios WHERE email = {email}`;
        
            conexion.end();
        
            ok(usuarioExistente);
        

        }catch(error){
            //5. Si ocurre un error, lo maneja con ko({ error: "error en la base de datos" }).
            ko({ error: "error en la base de datos" });
        }

    });   
}


export function registrarUsuario({name,email,hashedPassword}){
    return new Promise(async (ok,ko) => {
        
        const conexion = conectar();
        //Una vez hace la conexión, intenta buscar las tareas, si las encuentra las mostrará
        try{
            /*2. Ejecuta una consulta SQL SELECT * FROM tareas para obtener todos los registros de la tabla tareas.
                 Utiliza await para esperar el resultado de la consulta, que devuelve un array de objetos representando cada tarea.
            */
            let [{id}] = await conexion`INSERT INTO users (name, email, password) VALUES (${name},${email},${hashedPassword}) RETURNING *`;
            
            conexion.end();
        
            ok(id);
            console.log("se han traido los libros")

        }catch(error){
            //5. Si ocurre un error, lo maneja con ko({ error: "error en la base de datos" }).
            ko({ error: "error en la base de datos" });
        }

    });   
}


export function traerLibros(){
    return new Promise(async (ok,ko) => {
        
        const conexion = conectar();
        //Una vez hace la conexión, intenta buscar las tareas, si las encuentra las mostrará
        try{
            /*2. Ejecuta una consulta SQL SELECT * FROM tareas para obtener todos los registros de la tabla tareas.
                 Utiliza await para esperar el resultado de la consulta, que devuelve un array de objetos representando cada tarea.
            */
            let libros = await conexion`SELECT * FROM libros`;
            
            conexion.end();
        
            ok(libros);
            console.log("se han traido los libros")

        }catch(error){
            //5. Si ocurre un error, lo maneja con ko({ error: "error en la base de datos" }).
            ko({ error: "error en la base de datos" });
        }

    });   
}


