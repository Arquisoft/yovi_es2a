use mongodb::{Client, options::ClientOptions, bson::doc};
use std::env;
use dotenv::dotenv;

pub async fn init_db() -> Client {
    dotenv().ok();

    let uri = env::var("MONGODB_STRING").expect("ERROR: La variable MONGODB_STRING no está configurada.");

    let options = ClientOptions::parse(&uri)
        .await
        .expect("Error al parsear la URI de MongoDB");

    let client = Client::with_options(options)
        .expect("Error al crear el cliente de MongoDB");

    client
        .database("admin")
        .run_command(doc! {"ping": 1}, None)
        .await
        .expect("No se pudo conectar a MongoDB: El servidor no responde");

    println!("Conexión a MongoDB establecida con éxito.");

    client
}