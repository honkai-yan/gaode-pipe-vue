import { defineStore } from "pinia";
import { ref } from "vue";

export const useAppStatStore = defineStore("appStat", () => {
  const appStat = ref({
    mapInstanceLoadStat: "none", // none, done, err
  });

  return { appStat };
});
