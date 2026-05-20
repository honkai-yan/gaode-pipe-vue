import { createApp } from "vue";
import "./style.css";
import "element-plus/dist/index.css";
import App from "./AppX.vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";

document.oncontextmenu = (e) => false;

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(ElementPlus);
app.mount("#app");
