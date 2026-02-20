use mongodb::{Client, options::ClientOptions, bson::doc};
use std::env;
use dotenv::dotenv;
use mongodb::bson::Document;

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

pub async fn registrar_usuario(client: &Client, nombre_usuario: &str) {
    let collection = client.database("yovi_es2a").collection::<Document>("usuarios");

    let nuevo_usuario = doc! {
        "username": nombre_usuario,
    };

    match collection.insert_one(nuevo_usuario, None).await {
        Ok(_) => println!("Usuario '{}' guardado correctamente en Atlas.", nombre_usuario),
        Err(e) => println!("Error al guardar el usuario: {}", e),
    }
}