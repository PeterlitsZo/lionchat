import type { Component } from "solid-js";
import { For } from "solid-js";
import classNames from 'classnames';

import styles from './UserStat.module.css';

type UserStatProp = {
  // An array of user name.
  userList: () => string[];
  class?: string;
};

const UserStat: Component<UserStatProp> = (props: UserStatProp) => {
  const { userList, class: className } = props;

  return (
    <div class={classNames(className, styles.UserStat)}>
      <h2 class={styles.UserStat__UserCounter}>
        当前在线用户数：{userList().length}
      </h2>
      <div class={styles.UserStat__UserList}>
        <For each={userList()}>{
          (user) => (<p>{user}</p>)
        }</For>
      </div>
    </div>
  )
};

export default UserStat;
