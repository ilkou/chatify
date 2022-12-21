<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { currentUser, pb } from "./pocketbase";

  let newMessage: string;
  let unsubscribe: () => void;
  let messages = [];

  onMount(async () => {
    const resultList = await pb.collection("messages").getList(1, 10, {
      sort: "created",
      expand: "user",
    });
    messages = resultList.items;

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
    const createdMessage = await pb.collection("messages").create({
      text: newMessage,
      user: $currentUser.id,
    });
    newMessage = "";
  }
</script>

<br />
<div>
  {#each messages as message (message.id)}
    <div>
      <div>{message.expand?.user?.username}: {message.text}</div>
    </div>
  {/each}
</div>

<form on:submit|preventDefault={createMessage}>
  <input placeholder="Type message..." type="text" bind:value={newMessage} />
  <button type="submit">SEND</button>
</form>
