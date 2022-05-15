use std::collections::HashMap;
use std::net::{TcpStream, SocketAddr};
use std::sync::{Arc, Mutex};

use json::JsonValue;
use log::{info, warn};
use websocket::sync::{Reader, Writer, server::Upgrade};
use websocket::OwnedMessage;
use nanoid::nanoid;

use crate::control_message::{ControlMessage, Close, SendToClient, SendToAll};
use crate::message::{handshake, user_msg, login, logout};

#[derive(Clone)]
pub struct Client {
    pub map: Arc<Mutex<ClientMap>>,
    pub id: Arc<String>,
    pub addr: Arc<SocketAddr>,
    pub nickname: Arc<Mutex<String>>,
    pub sender: Arc<Mutex<Writer<TcpStream>>>,
    pub receiver: Arc<Mutex<Reader<TcpStream>>>,
}

pub type ClientMap = HashMap<Arc<String>, Client>;

impl Client {
    pub fn new(client_map: Arc<Mutex<ClientMap>>, connection: Upgrade<TcpStream>) -> Self {
        // Get the basic infomation
        let addr = connection.tcp_stream().peer_addr().unwrap();
        let client = connection.accept().unwrap();
        let (receiver, sender) = client.split().unwrap();

        // Build self's infomation.
        let client_id = nanoid!();
        let client_nickname = Arc::new(Mutex::new(client_id.clone()));
        let client_id = Arc::new(client_id);

        // Build self.
        let client = Client {
            map: client_map.clone(),
            id: client_id.clone(),
            nickname: client_nickname,
            addr: Arc::new(addr),
            sender: Arc::new(Mutex::new(sender)),
            receiver: Arc::new(Mutex::new(receiver)),
        };

        // Add self to map.
        client_map.lock().unwrap().insert(client_id, client.clone());

        return client;
    }

    pub fn handle_connection(&self) {
        // Listen to the message from the client
        let mut receiver = self.receiver.lock().unwrap();

        // Try to handle those message.
        let control_message_iter = receiver
            .incoming_messages()
            .map(|x| self.handle_message(x.unwrap()).into_iter())
            .flatten();

        // Send a handshake message before we try to handle those message.
        let user_id = self.id.as_str();
        let all_user_id: Vec<String> = self.get_all_user_id();
        let handshake = OwnedMessage::Text(handshake(user_id, all_user_id));
        let handshake: Box<dyn ControlMessage> = Box::new(SendToClient::new(handshake));
        let mut control_message_iter = [handshake]
            .into_iter()
            .chain(control_message_iter);

        // Run.
        control_message_iter
            .try_for_each(|control_message| control_message.exec(self));
    }

    fn get_all_user_id(&self) -> Vec<String> {
        let map = self.map.lock().unwrap();
        let mut result = vec![];
        for key in map.keys() {
            result.push(String::clone(key));
        }
        result
    }

    pub fn handle_message(&self, message: OwnedMessage) -> Vec<Box<dyn ControlMessage>> {
        match message {
            OwnedMessage::Close(close) => {
                info!("Get Close: {:?}", close);
                return vec![Box::new(Close::new())];
            }
            OwnedMessage::Ping(ping) => {
                info!("Get Ping: {:?}", ping);
                return vec![Box::new(SendToClient::new(OwnedMessage::Pong(ping)))];
            }
            OwnedMessage::Text(text) => {
                let message = json::parse(&text).unwrap();
                info!("Get Text: {}", message);
                return self.handle_text(message);
            }
            OwnedMessage::Pong(pong) => {
                info!("Get Pong: {:?}", pong);
                return vec![];
            }
            OwnedMessage::Binary(binary) => {
                info!("Get Binary: {:?}", binary);
                return vec![];
            }
        }
    }

    fn handle_text(&self, message: JsonValue) -> Vec<Box<dyn ControlMessage>> {
        match &message["type"].as_str() {
            Some("login") => self.handle_login(),
            Some("logout") => self.handle_logout(),
            Some("userMsg") => self.handle_send(message),
            others => {
                warn!("The type is {:?}, but we want have a short string", others);
                vec![]
            }
        }
    }

    fn handle_login(&self) -> Vec<Box<dyn ControlMessage>> {
        let message = OwnedMessage::Text(login(self.id.as_str()));
        vec![Box::new(SendToAll::new(message))]
    }

    fn handle_logout(&self) -> Vec<Box<dyn ControlMessage>> {
        let message = OwnedMessage::Text(logout(self.id.as_str()));
        vec![Box::new(SendToAll::new(message))]
    }

    fn handle_send(&self, message: JsonValue) -> Vec<Box<dyn ControlMessage>> {
        let message = message["data"]["content"].as_str();
        if let Some(message) = message {
            let message = OwnedMessage::Text(user_msg(self.id.as_str(), message));
            vec![Box::new(SendToAll::new(message))]
        } else {
            vec![]
        }
    }

    pub fn send_message(&self, message: &OwnedMessage) {
        let mut sender = self.sender.lock().unwrap();
        sender.send_message(message).unwrap();
    }

    pub fn send_message_to_others(&self, message: &OwnedMessage) {
        let map = self.map.lock().unwrap();

        for (_id, client) in map.iter() {
            client.send_message(message);
        }
    }

    pub fn remove_self(&self) {
        let mut map = self.map.lock().unwrap();
        map.remove(&self.id);
    }
}
