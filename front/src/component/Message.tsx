import type { Component } from "solid-js";
import { For, Show, createSignal, createEffect } from "solid-js";
import classNames from 'classnames';

import styles from './Message.module.css';

import TextInputTool from './TextInputTool';

type MessageProps = {
  // An array of user name.
  class?: string;
  msgList: () => [string, string][];
  send: () => (msg: string) => void;
};

const Message: Component<MessageProps> = (props) => {
  const { class: className, msgList, send } = props;

  const [showName, setShowName] = createSignal([] as boolean[], { equals: false });

  createEffect(() => {
    console.log(msgList(), showName());
    if (msgList().length !== showName().length) {
      for (let i = showName().length; i < msgList().length; i ++) {
        setShowName((prev) => {
          prev.push(i === 0 || msgList()[i][0] !== msgList()[i - 1][0]);
          return prev;
        });
      }
    }
  });

  return (
    <div class={classNames(className, styles.Message)}>
      <h1 class={styles.Message__Header}>LionChat</h1>
      <div class={styles.Message__History}>
        <For each={msgList()}>{
          (msg, index) => (
            <>
              <Show when={showName()[index()]}>
                <div class={styles.Message__History__Name}>{msg[0]}</div>
              </Show>
              <div class={styles.Message__History__Message}>{msg[1]}</div>
            </>
          )
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
