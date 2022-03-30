import type { Component } from 'solid-js';
import { createSignal, onMount, onCleanup } from 'solid-js';

import uuid from '../util/uuid';

import styles from './App.module.css';

import UserStat from './UserStat';
import Message from './Message';

type WsSystemMsg = { type: 'system', content: string };
type WsUserMsg = { type: 'user', from: string, content: string };
type WsHandshakeMsg = { type: 'handshake' };
type WsLoginMsg = { type: 'login', content: string, user_list: string[] };
type WsLogoutMsg = { type: 'logout', content: string, user_list: string[] };
type WsMsg =
  | WsSystemMsg
  | WsUserMsg
  | WsHandshakeMsg
  | WsLoginMsg
  | WsLogoutMsg;

type WsSendSendMsg = { type: 'send', content: string };
type WsSendLoginMsg = { type: 'login', content: string };
type WsSendLogoutMsg = { type: 'logout', content: string };
type WsSendMsg =
  | WsSendSendMsg
  | WsSendLoginMsg
  | WsSendLogoutMsg;

const App: Component = () => {
  const [msgList, setMsgList] = createSignal([] as string[], { equals: false });
  const [userList, setUserList] = createSignal([] as string[], { equals: false });

  const pushToMsgList = (msg: string) => setMsgList((msgList) => {
    msgList.push(msg);
    return msgList;
  });
  // Will be change after this app is on mount.
  let [send, setSend] = createSignal((msg: string) => console.log(msg));

  onMount(() => {
    const uname = prompt('请输入用户名', 'user' + uuid(8, 16)) ?? '<unknown>';
    const ws = new WebSocket("ws://127.0.0.1:1234");
    const sendMsgToWs = (msg: WsSendMsg) => ws.send(JSON.stringify(msg));
    const dealUser = (user_name: string, type: 'login' | 'logout', name_list: string[]) => {
      setUserList(name_list);
      const change = type === 'login' ? '上线' : '下线';
      pushToMsgList(`系统消息：${user_name}已${change}`);
    }
    ws.onopen = () => pushToMsgList('系统消息：建立连接成功');
    ws.onerror = () => pushToMsgList('系统消息：出错了，请退出重试');
    ws.onmessage = (e) => {
      const msg: WsMsg = JSON.parse(e.data);
      let sender = '';

      switch (msg.type) {
        case 'system':
          sender = '系统消息：';
          break;
        case 'user':
          sender = msg.from + '：';
          break;
        case 'handshake':
          sendMsgToWs({ type: 'login', content: uname });
          return;
        case 'login':
        case 'logout':
          const user_name = msg.content;
          const name_list = msg.user_list;
          const change_type = msg.type;
          dealUser(user_name, change_type, name_list);
          return;
      }

      pushToMsgList(sender + msg.content);
    };

    setSend(() => (msg: string) => {
      const reg = new RegExp("\r\n", "g");
      msg = msg.replace(reg, "");
      console.log(msg);
      sendMsgToWs({ type: 'send', content: msg.trim() });
    });
    addEventListener('unload', () => {
      sendMsgToWs({ type: 'logout', content: uname });
      ws.close();
    });
  });

  return (
    <div class={styles.App}>
      <UserStat class={styles.App__HelpPart} userList={userList} />
      <Message
        class={styles.App__MainPart}
        msgList={msgList}
        send={send}
      />
    </div>
  );
};

export default App;
