import type { Component } from 'solid-js';
import { createSignal, onMount } from 'solid-js';

import styles from './App.module.css';

import UserStat from './UserStat';
import Message from './Message';

// The message from system.
type WsGetSystemMsg = { type: 'systemMsg', data: { content: string } };
// The massage from user.
type WsGetUserMsg = { type: 'userMsg', data: { from: string, content: string } };
// The server give us a user id.
type WsGetHandshakeMsg = { type: 'handshake', data: { userId: string, allUserId: string[] } };
// New person with a user id.
type WsGetLoginMsg = { type: 'login', data: { userId: string } };
// The person with the user id leave.
type WsGetLogoutMsg = { type: 'logout', data: { userId: string } };
// P2P, Try to connect to another peer node.
type WsGetTryConnectMsg = { type: 'tryConnect', data: { peerAddr: string } };
type WsGetMsg =
  | WsGetHandshakeMsg
  | WsGetLoginMsg
  | WsGetTryConnectMsg
  | WsGetSystemMsg
  | WsGetUserMsg
  | WsGetLogoutMsg;

// Send user message.
type WsSendSendMsg = { type: 'userMsg', data: { content: string } };
// Send login message.
type WsSendLoginMsg = { type: 'login' };
// Send logout message.
type WsSendLogoutMsg = { type: 'logout' };
type WsSendMsg =
  | WsSendSendMsg
  | WsSendLoginMsg
  | WsSendLogoutMsg;

const App: Component = () => {
  const [msgList, setMsgList] = createSignal([] as [string, string][], { equals: false });
  const [userSet, setUserSet] = createSignal(new Set() as Set<string>, { equals: false });
  const [userId, setUserId] = createSignal(undefined as string | undefined);

  const pushToMsgList = (sender: string, msg: string) => setMsgList((msgList) => {
    msgList.push([sender, msg]);
    return msgList;
  });
  const insertToUserSet = (userid: string) => setUserSet((userSet) => {
    userSet.add(userid);
    return userSet;
  });
  const removeFromUserSet = (userid: string) => setUserSet((userSet) => {
    userSet.delete(userid);
    return userSet;
  });

  // Will be change after this app is on mount.
  let [send, setSend] = createSignal((msg: string) => console.log(msg));

  onMount(() => {
    const ws = new WebSocket("ws://127.0.0.1:1434");
    const sendMsgToWs = (msg: WsSendMsg) => ws.send(JSON.stringify(msg));
    const dealUser = (user_id: string, type: 'login' | 'logout') => {
      if (type === 'login') {
        pushToMsgList('上线通知', `${user_id}已上线`);
        insertToUserSet(user_id);
      } else {
        pushToMsgList('下线通知', `${user_id}已下线`);
        removeFromUserSet(user_id);
      }
    }
    ws.onopen = () => pushToMsgList('连接状态', '建立连接成功');
    ws.onerror = () => pushToMsgList('连接状态', '出错了，请退出重试');
    ws.onmessage = (e) => {
      const msg: WsGetMsg = JSON.parse(e.data);
      let sender = '';

      switch (msg.type) {
        case 'systemMsg':
          sender = '系统消息';
          break;
        case 'userMsg':
          sender = msg.data.from;
          break;
        case 'handshake':
          setUserId(msg.data.userId);
          sendMsgToWs({ type: 'login' });
          setUserSet(new Set(msg.data.allUserId));
          return;
        case 'login':
        case 'logout':
          const user_name = msg.data.userId;
          const change_type = msg.type;
          dealUser(user_name, change_type);
          return;
        case 'tryConnect':
          return;
      }

      pushToMsgList(sender, msg.data.content);
    };

    setSend(() => (msg: string) => {
      const reg = new RegExp("\r\n", "g");
      msg = msg.replace(reg, "");
      console.log(msg);
      sendMsgToWs({ type: 'userMsg', data: { content: msg.trim() } });
    });
    addEventListener('unload', () => {
      sendMsgToWs({ type: 'logout' });
      ws.close();
    });
  });

  return (
    <div class={styles.App}>
      <UserStat class={styles.App__HelpPart} userSet={userSet} />
      <Message
        class={styles.App__MainPart}
        msgList={msgList}
        send={send}
      />
    </div>
  );
};

export default App;
