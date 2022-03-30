import type { Component } from "solid-js";
import { For } from "solid-js";
import classNames from 'classnames';

import styles from './Message.module.css';

import TextInputTool from './TextInputTool';

type MessageProps = {
  // An array of user name.
  class?: string;
  msgList: () => string[];
  send: () => (msg: string) => void;
};

const Message: Component<MessageProps> = (props) => {
  const { class: className, msgList, send } = props;

  return (
    <div class={classNames(className, styles.Message)}>
      <h1 class={styles.Message__Header}>LionChat</h1>
      <div class={styles.Message__History}>
        <For each={msgList()}>{
          (msg) => (<p>{msg}</p>)
        }</For>
      </div>
      <TextInputTool
        class={styles.Message__TextInputTool}
        callback={(text: string) => {send()(text)}}
      />
    </div>
  )
};

export default Message;
