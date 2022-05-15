use json::object;

pub fn handshake (user_id: &str, all_user_id: Vec<String>) -> String {
    let message = object! {
        type: "handshake",
        data: {
            userId: user_id,
            allUserId: all_user_id,
        }
    };
    message.dump()
}

pub fn login (user_id: &str) -> String {
    let message = object! {
        type: "login",
        data: { userId: user_id },
    };
    message.dump()
}

pub fn try_connect (peer_addr: &str) -> String {
    let message = object! {
        type: "tryConnect",
        data: { peerAddr: peer_addr },
    };
    message.dump()
}

pub fn user_msg (from: &str, content: &str) -> String {
    let message = object! {
        type: "userMsg",
        data: { from: from, content: content },
    };
    message.dump()
}

pub fn system_msg (content: &str) -> String {
    let message = object! {
        type: "systemMsg",
        data: { content: content },
    };
    message.dump()
}

pub fn logout (user_id: &str) -> String {
    let message = object!{
        type: "logout",
        data: { userId: user_id },
    };
    message.dump()
}
