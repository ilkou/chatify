<script lang="ts">
  import { onMount, onDestroy, beforeUpdate, afterUpdate } from "svelte";
  import { currentUser, pb } from "./pocketbase";
  import { getUsernameStyles } from "./utils.js";

  let newMessage: string;
  let unsubscribe: () => void;
  let messages = [];
  let div;
  let autoscroll;

  beforeUpdate(() => {
    autoscroll =
      div && div.offsetHeight + div.scrollTop > div.scrollHeight - 20;
  });

  afterUpdate(() => {
    if (autoscroll) div.scrollTo(0, div.scrollHeight);
  });

  onMount(async () => {
    messages = await pb.collection("messages").getFullList(50, {
      sort: "created",
      expand: "user",
    });

    unsubscribe = await pb
      .collection("messages")
      .subscribe("*", async ({ action, record }) => {
        if (action === "create") {
          const user = await pb.collection("users").getOne(record.user);
          record.expand = { user };
          messages = [...messages, record];
        }
        if (action === "delete") {
          messages = messages.filter((message) => message.id !== record.id);
        }
      });
  });
  onDestroy(() => {
    unsubscribe?.();
  });

  async function createMessage() {
    await pb.collection("messages").create({
      text: newMessage,
      user: $currentUser.id,
    });
    newMessage = "";
  }
</script>

<br />

<div class="chat-container" bind:this={div}>
  {#each messages as message, i (message.id)}
    <div>
      <span style={getUsernameStyles(message.expand?.user?.id)}>
        {message.expand?.user?.username}:
      </span>{message.text}
    </div>
  {/each}
</div>

<form on:submit|preventDefault={createMessage}>
  <input placeholder="Type message..." type="text" bind:value={newMessage} />
  <button type="submit">SEND</button>
</form>
