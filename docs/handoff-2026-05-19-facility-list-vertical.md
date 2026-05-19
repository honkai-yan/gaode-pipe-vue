# Handoff: 设施列表布局改动

## 修改时间
2026-05-19

## 修改内容
将项目页面右上角的设施图片列表从水平滚动改为垂直滚动的网格布局。

## 改动文件
- `src/App.vue` (样式部分，第708-756行)

## 具体改动

### `.facility-scroll-container`
- `display: flex` → `display: grid`
- 新增 `grid-template-columns: repeat(5, 1fr)`（每行5个项目）
- `overflow-x: auto` → `overflow-y: auto`
- 新增 `max-height: 320px` 限制最大高度

### `.facility-scroll-container::-webkit-scrollbar`
- `height: 6px` → `width: 6px`（改为垂直滚动条）

### `.facility-item`
- 移除 `flex-shrink: 0`
- `width: 90px` → `width: 100%`（grid 项目自动填充）

## 验证步骤
1. 启动开发服务器: `pnpm dev`
2. 打开页面，查看右上角设施列表
3. 确认列表为网格布局，每行5个项目
4. 当项目较多时，确认出现垂直滚动条

---

# Handoff: 设施列表宽度固定为90px

## 修改时间
2026-05-19

## 修改背景
设施列表项宽度撑满容器，导致文字省略样式无法生效。需要固定列表项宽度为90px，与网格尺寸一致。

## 改动文件
- `src/App.vue` (样式部分，第714-724行、第735-736行)

## 具体改动

### `.facility-scroll-container`
- `grid-template-columns: repeat(5, 1fr)` → `grid-template-columns: repeat(4, 90px)`
  - 列数从5列改为4列
  - 每列宽度固定为90px
- `max-height: 320px` → `max-height: 222px`
  - 高度精确计算为2行：单行约105px × 2行 + gap 12px = 222px

### `.facility-item`
- `width: 100%` → `width: 90px`
  - 固定宽度使文字省略号样式生效

## 尺寸计算

| 元素 | 尺寸 |
|------|------|
| 网格列宽 | 90px |
| 网格列数 | 4列 |
| 网格间距 | 12px |
| 单行高度 | ~105px (图片80 + 间距8 + 文字17) |
| 最大高度 | 222px (2行 + gap) |

## 验证步骤
1. 启动开发服务器: `pnpm dev`
2. 查看右上角设施列表
3. 确认每行显示4个列表项，每个宽度90px
4. 确认长文字显示省略号
5. 确认超过8个设施时出现垂直滚动条

## 回退方式
如需回退，恢复 `src/App.vue` 中被修改的 CSS 部分即可。
