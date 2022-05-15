import type { Component } from "solid-js";
import { For } from "solid-js";
import classNames from 'classnames';

import styles from './UserStat.module.css';

type UserStatProp = {
  // An array of user name.
  userSet: () => Set<string>;
  class?: string;
};

const UserStat: Component<UserStatProp> = (props: UserStatProp) => {
  const { userSet, class: className } = props;

  return (
    <div class={classNames(className, styles.UserStat)}>
      <h2 class={styles.UserStat__UserCounter}>
        当前在线用户数：{userSet().size}
      </h2>
      <div class={styles.UserStat__UserList}>
        <For each={Array.from(userSet())}>{
          (user) => (<p>{user}</p>)
        }</For>
      </div>
    </div>
  )
};

export default UserStat;
