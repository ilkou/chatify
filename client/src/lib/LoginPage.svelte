<script lang="ts">
  import { currentUser, pb } from "./pocketbase";
  import Messages from "./Messages.svelte";

  let username: string;
  let password: string;

  async function login() {
    await pb.collection("users").authWithPassword(username, password);
  }
  async function createUser() {
    try {
      const data = {
        username,
        password,
        passwordConfirm: password,
      };
      await pb.collection("users").create(data);
      await login();
    } catch (error) {
      console.error(error);
    }
  }
  function logout() {
    pb.authStore.clear();
  }
</script>

{#if $currentUser}
  <p>Logged in as {$currentUser.username}</p>
  <button on:click={logout}>Logout</button>
  <Messages />
{:else}
  <form on:submit|preventDefault={login}>
    <input placeholder="Username" type="text" bind:value={username} />
    <input placeholder="Password" type="password" bind:value={password} />
    <button type="submit">Login</button>
    <p>
      Don't have an account ? <button type="button" on:click={createUser}
        >SignUp</button
      >
    </p>
  </form>
{/if}
