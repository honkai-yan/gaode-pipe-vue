import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

import { ElInput, ElButton, ElScrollbar, ElMessage, ElMessageBox } from "element-plus";
import "element-plus/es/components/input/style/css";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/scrollbar/style/css";
import "element-plus/es/components/message/style/css";
import "element-plus/es/components/message-box/style/css";

document.oncontextmenu = (e) => false;

const app = createApp(App);

app.component("ElInput", ElInput);
app.component("ElButton", ElButton);
app.component("ElScrollbar", ElScrollbar);
app.config.globalProperties.$message = ElMessage;

app.mount("#app");
