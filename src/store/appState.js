import { defineStore } from "pinia";
import { ref } from "vue";

export const useAppStatStore = defineStore("appStat", () => {
  const appStat = ref({
    mapInstanceLoadStat: "none", // none, done, err
    addFacilityContinuously: false, // false:添加一次设施后退出,true:可以连续添加设施
  });

  return { appStat };
});
