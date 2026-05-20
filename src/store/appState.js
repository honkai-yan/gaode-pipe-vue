import { defineStore } from "pinia";
import { ref } from "vue";

export const useAppStatStore = defineStore("appStat", () => {
  const appStat = ref({
    drawLineMode: false, // 是否处于绘制线段模式
    mapInstanceLoadStat: "none", // none, done, err
  });

  return { appStat };
});
