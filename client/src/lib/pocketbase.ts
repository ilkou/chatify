import Pocketbase from "pocketbase";

import { writable } from "svelte/store";

export const pb = new Pocketbase(
  "http://localhost:8088"
  // "https://learn-pb-prod-pocket-di0czo.mo6.mogenius.io"
);

export const currentUser = writable(pb.authStore.model);

pb.authStore.onChange((auth) => {
  console.log("authStore changed: ", auth);
  currentUser.set(pb.authStore.model);
});
