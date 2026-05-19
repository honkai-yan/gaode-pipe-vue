<script setup>
import { computed } from "vue";

const props = defineProps({
  visible: Boolean,
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 }),
  },
});

const emit = defineEmits(["update:visible", "edit", "delete"]);

const menuStyle = computed(() => {
  const MENU_WIDTH = 150;
  const MENU_MAX_HEIGHT = 120;
  const MARGIN = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let x = props.position.x;
  let y = props.position.y;

  if (x + MENU_WIDTH + MARGIN > vw) {
    x = vw - MENU_WIDTH - MARGIN;
  }
  if (x < MARGIN) x = MARGIN;

  if (y + MENU_MAX_HEIGHT + MARGIN > vh) {
    y = vh - MENU_MAX_HEIGHT - MARGIN;
  }
  if (y < MARGIN) y = MARGIN;

  return {
    left: `${x}px`,
    top: `${y}px`,
  };
});

const handleOverlayClick = () => {
  emit("update:visible", false);
};

const handleEdit = () => {
  emit("update:visible", false);
  emit("edit");
};

const handleDelete = () => {
  emit("update:visible", false);
  emit("delete");
};
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="context-menu-overlay" @click="handleOverlayClick">
      <div class="context-menu" :style="menuStyle" @click.stop>
        <div class="menu-item" @click="handleEdit">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          编辑数据
        </div>
        <div class="menu-item menu-item-danger" @click="handleDelete">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          删除线段
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.context-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: transparent;
}

.context-menu {
  position: fixed;
  width: 150px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 2001;
  padding: 4px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s;
}

.menu-item:hover {
  background: #f3f4f6;
}

.menu-item-danger {
  color: #dc2626;
}

.menu-item-danger:hover {
  background: #fef2f2;
}
</style>
