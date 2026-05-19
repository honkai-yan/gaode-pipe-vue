import { Command } from './base.js';

// ========== 线段相关命令 ==========

/**
 * 添加线段命令
 */
export class AddSegmentCommand extends Command {
  /**
   * @param {AMap.Polyline} polyline - 高德地图折线对象
   * @param {Object} context - 执行上下文
   * @param {AMap.Map} context.mapInstance - 地图实例
   * @param {AMap.Polyline[]} context.pipeLines - 线段数组
   * @param {Function} context.updateCount - 更新线段计数的回调
   */
  constructor(polyline, context) {
    super('segment:add', '添加线段');
    this.polyline = polyline;
    this.context = context;
  }

  execute() {
    this.context.pipeLines.push(this.polyline);
    this.context.mapInstance.add(this.polyline);
    this.context.updateCount();
  }

  undo() {
    this.context.mapInstance.remove(this.polyline);
    const idx = this.context.pipeLines.indexOf(this.polyline);
    if (idx > -1) {
      this.context.pipeLines.splice(idx, 1);
    }
    this.context.updateCount();
  }
}

/**
 * 删除线段命令
 */
export class DeleteSegmentCommand extends Command {
  /**
   * @param {AMap.Polyline} polyline - 高德地图折线对象
   * @param {Object} context - 执行上下文
   * @param {AMap.Map} context.mapInstance - 地图实例
   * @param {AMap.Polyline[]} context.pipeLines - 线段数组
   * @param {Function} context.updateCount - 更新线段计数的回调
   */
  constructor(polyline, context) {
    super('segment:delete', '删除线段');
    this.polyline = polyline;
    this.context = context;
  }

  execute() {
    this.context.mapInstance.remove(this.polyline);
    const idx = this.context.pipeLines.indexOf(this.polyline);
    if (idx > -1) {
      this.context.pipeLines.splice(idx, 1);
    }
    this.context.updateCount();
  }

  undo() {
    this.context.pipeLines.push(this.polyline);
    this.context.mapInstance.add(this.polyline);
    this.context.updateCount();
  }
}

// ========== 标记相关命令 ==========

/**
 * 添加标记命令
 */
export class AddMarkerCommand extends Command {
  /**
   * @param {AMap.Marker} marker - 高德地图标记对象
   * @param {Object} context - 执行上下文
   * @param {AMap.Map} context.mapInstance - 地图实例
   * @param {AMap.Marker[]} context.placedMarkers - 标记数组
   */
  constructor(marker, context) {
    super('marker:add', '添加标记');
    this.marker = marker;
    this.context = context;
  }

  execute() {
    this.context.placedMarkers.push(this.marker);
    this.context.mapInstance.add(this.marker);
  }

  undo() {
    this.context.mapInstance.remove(this.marker);
    const idx = this.context.placedMarkers.indexOf(this.marker);
    if (idx > -1) {
      this.context.placedMarkers.splice(idx, 1);
    }
  }
}

/**
 * 删除标记命令
 */
export class DeleteMarkerCommand extends Command {
  /**
   * @param {AMap.Marker} marker - 高德地图标记对象
   * @param {Object} context - 执行上下文
   * @param {AMap.Map} context.mapInstance - 地图实例
   * @param {AMap.Marker[]} context.placedMarkers - 标记数组
   */
  constructor(marker, context) {
    super('marker:delete', '删除标记');
    this.marker = marker;
    this.context = context;
  }

  execute() {
    this.context.mapInstance.remove(this.marker);
    const idx = this.context.placedMarkers.indexOf(this.marker);
    if (idx > -1) {
      this.context.placedMarkers.splice(idx, 1);
    }
  }

  undo() {
    this.context.placedMarkers.push(this.marker);
    this.context.mapInstance.add(this.marker);
  }
}
