import { createApp } from "vue";
import "./style.css";
import App from "./AppX.vue";
import { createPinia } from "pinia";

import { ElInput, ElButton, ElScrollbar, ElMessage } from "element-plus";
import "element-plus/es/components/input/style/css";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/scrollbar/style/css";
import "element-plus/es/components/message/style/css";
import "element-plus/es/components/message-box/style/css";

document.oncontextmenu = (e) => false;

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

app.component("ElInput", ElInput);
app.component("ElButton", ElButton);
app.component("ElScrollbar", ElScrollbar);
app.config.globalProperties.$message = ElMessage;

app.mount("#app");
