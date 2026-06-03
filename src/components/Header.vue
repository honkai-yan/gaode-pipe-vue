<script setup></script>

<template>
  <header class="header">
    <div class="toolbar">
      <div class="item" title="保存项目">
        <span class="iconfont icon-save" style="font-size: 24px"></span>
      </div>
      <div class="item" title="导入项目">
        <span
          class="iconfont icon-import1"
          style="font-size: 20px; font-weight: bold"
        ></span>
      </div>
      <div class="item" title="计算">
        <span
          class="iconfont icon-calculate"
          style="font-size: 18px; font-weight: bold"
        ></span>
      </div>
    </div>

    <div class="brand">
      <img src="/brand-dev.svg" alt="brand logo">
      <h1>设计平台</h1>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: relative;
  width: 100%;
  height: 48px;
  border-bottom: 1px solid rgba(117, 117, 117, 0.2);
  background-color: rgba(255, 255, 255, 0.95);
}

.header .toolbar {
  width: fit-content;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;

  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.header .item {
  width: 36px;
  height: 36px;
  border-radius: 8px;

  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  user-select: none;
}
.header .item:hover {
  background-color: rgba(207, 207, 207, 0.5);
}
.header .item:active {
  background-color: rgba(161, 161, 161, 0.5);
}

.header .item span {
  font-size: 20px;
}

.header .brand {
  height: 100%;
  width: fit-content;

  display: flex;
  gap: 8px;
  align-items: center;
  padding-left: 12px;
}

.header .brand img {
  width: 32px;
  height: 32px;
  object-fit: cover;
}

.header .brand h1 {
  font-weight: bold;
}
</style>
