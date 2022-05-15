mod client;
mod control_message;
mod message;

use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use std::thread;

use websocket::sync::Server;

use client::{Client, ClientMap};

fn main() {
    env_logger::init();

    let addr = SocketAddr::from(([127, 0, 0, 1], 1434));
    let server = Server::bind(addr).unwrap();
    let client_map: Arc<Mutex<ClientMap>> = Arc::new(Mutex::new(HashMap::new()));

    for connection in server.filter_map(Result::ok) {
        let client = Client::new(client_map.clone(), connection);

        // Open another thread to handle message.
        thread::spawn(move || client.handle_connection());
    }
}
