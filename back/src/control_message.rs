use std::ops::ControlFlow;

use log::info;
use websocket::OwnedMessage;

use crate::client::Client;

pub trait ControlMessage {
    fn exec(&self, client: &Client) -> ControlFlow<()>;
}

pub struct Close {}

impl Close {
    pub fn new() -> Self {
        Close {}
    }
}

impl ControlMessage for Close {
    fn exec(&self, client: &Client) -> ControlFlow<()> {
        info!("Exec `Close` control message");

        client.send_message(&OwnedMessage::Close(None));
        client.remove_self();

        return ControlFlow::Break(());
    }
}

pub struct SendToClient {
    message: OwnedMessage,
}

impl SendToClient {
    pub fn new(message: OwnedMessage) -> Self {
        SendToClient { message }
    }
}

impl ControlMessage for SendToClient {
    fn exec(&self, client: &Client) -> ControlFlow<()> {
        info!("Exec `SendToClient` control message");

        client.send_message(&self.message);

        return ControlFlow::Continue(());
    }
}

pub struct SendToAll {
    message: OwnedMessage,
}

impl SendToAll {
    pub fn new(message: OwnedMessage) -> Self {
        SendToAll { message }
    }
}

impl ControlMessage for SendToAll {
    fn exec(&self, client: &Client) -> ControlFlow<()> {
        info!("Exec `SendToAll` control message");

        client.send_message_to_others(&self.message);

        return ControlFlow::Continue(());
    }
}
