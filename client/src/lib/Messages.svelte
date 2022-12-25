<script lang="ts">
  import { onMount, onDestroy, beforeUpdate, afterUpdate } from "svelte";
  import { currentUser, pb } from "./pocketbase";
  import { getUsernameStyles } from "./utils.js";

  let newMessage: string;
  let unsubscribe: () => void;
  let messages = [];
  let orderedMessages;
  let div;
  let autoscroll;
  let hasLoadedEverything = false;
  let loadingOldMessages = false;
  let sizeOfMessages = 15;

  beforeUpdate(() => {
    autoscroll =
      div && div.offsetHeight + div.scrollTop > div.scrollHeight - 20;
  });

  afterUpdate(() => {
    if (autoscroll) div.scrollTo(0, div.scrollHeight);
  });

  async function loadMessages(pageSize) {
    const response = await pb.collection("messages").getList(1, pageSize, {
      sort: "-created",
      expand: "user",
    });
    if (response.totalItems == response.items.length) {
      hasLoadedEverything = true;
    }
    messages = response.items;
    loadingOldMessages = false;
  }

  onMount(async () => {
    await loadMessages(sizeOfMessages);

    unsubscribe = await pb
      .collection("messages")
      .subscribe("*", async ({ action, record }) => {
        if (action === "create") {
          const user = await pb.collection("users").getOne(record.user);
          record.expand = { user };
          messages = [record, ...messages];
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

  $: orderedMessages = [...messages].reverse();

  async function loadMoreOnTopChat(e) {
    if (e.target.scrollTop === 0) {
      loadingOldMessages = true;
      await loadMessages(sizeOfMessages + 4);
      sizeOfMessages = sizeOfMessages + 2;
      if (!hasLoadedEverything) {
        div.scrollTo(0, 30);
      }
    }
  }
</script>

<br />

<div class="chat-container" bind:this={div} on:scroll={loadMoreOnTopChat}>
  {loadingOldMessages && !hasLoadedEverything ? "Loading old Messages..." : ""}
  {#each orderedMessages as message, i (message.id)}
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
