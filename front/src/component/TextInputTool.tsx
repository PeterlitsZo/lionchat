import type { Component } from "solid-js";
import { createSignal } from "solid-js";

import styles from './TextInputTool.module.css';

type TextInputToolProps = {
  // An array of user name.
  class?: string;
  callback: (value: string) => void;
};

const TextInputTool: Component<TextInputToolProps> = (props) => {
  const { class: className, callback } = props;
  const [text, setText] = createSignal('');
  const [submit, setSubmit] = createSignal(false);

  const handleTextAreaChange = (event: any) => {
    const { target: textarea } = event;
    if (submit()) {
      setText('');
      setSubmit(false);
    } else {
      setText(textarea.value);
    }
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  const handleKeyDown = (event: any) => {
    if (event.code === 'Enter') {
      callback(text());
      setSubmit(true);
    }
  }

  return (
    <div class={className}>
      <textarea
        value={text()}
        class={styles.TextInputTool__Textarea}
        onInput={handleTextAreaChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

export default TextInputTool;
