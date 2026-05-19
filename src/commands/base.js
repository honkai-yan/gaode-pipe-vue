import { markRaw } from 'vue';

/**
 * 生成唯一ID
 * @returns {string} 唯一标识符
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Command 基类
 * 所有可撤销操作都应继承此类
 */
export class Command {
  /**
   * @param {string} type - 命令类型（如 'segment:add'）
   * @param {string} description - 命令描述（用于UI提示）
   */
  constructor(type, description = '') {
    this.id = generateId();
    this.type = type;
    this.description = description;
    this.timestamp = Date.now();
  }

  /**
   * 执行命令
   * 子类必须实现此方法
   */
  execute() {
    throw new Error('Command.execute() must be implemented by subclass');
  }

  /**
   * 撤销命令
   * 子类必须实现此方法
   */
  undo() {
    throw new Error('Command.undo() must be implemented by subclass');
  }
}

/**
 * Command Manager（命令管理器）
 * 借鉴 Redux Store 的设计思想：
 * - 单一状态源管理所有命令历史
 * - 订阅模式让 UI 自动响应状态变更
 * - 不可变操作：命令一旦创建不可修改
 */
export class CommandManager {
  /**
   * @param {Object} options - 配置选项
   * @param {number} options.maxSize - 最大历史记录数，默认 50
   */
  constructor(options = {}) {
    this.maxSize = options.maxSize || 50;
    this.past = [];      // 已执行命令栈（撤销栈）
    this.future = [];    // 可重做命令栈（重做栈）
    this.listeners = []; // 状态变更监听器数组
  }

  /**
   * 执行新命令
   * 命令会被立即执行，并添加到历史记录
   * 执行新命令后会清空重做栈
   * @param {Command} command - 要执行的命令
   * @returns {Command} 执行的命令
   */
  execute(command) {
    command.execute();
    this.past.push(markRaw(command));
    this.future = [];  // 新操作后清空重做栈

    // 淘汰最旧的命令
    if (this.past.length > this.maxSize) {
      this.past.shift();
    }

    this.notify();
    return command;
  }

  /**
   * 撤销最后一个命令
   * @returns {Command|null} 被撤销的命令，如果没有可撤销的命令则返回 null
   */
  undo() {
    if (this.past.length === 0) return null;

    const command = this.past.pop();
    command.undo();
    this.future.push(command);

    this.notify();
    return command;
  }

  /**
   * 重做下一个命令
   * @returns {Command|null} 被重做的命令，如果没有可重做的命令则返回 null
   */
  redo() {
    if (this.future.length === 0) return null;

    const command = this.future.pop();
    command.execute();
    this.past.push(command);

    this.notify();
    return command;
  }

  /**
   * 订阅状态变更（Redux 风格）
   * @param {Function} listener - 状态变更回调函数
   * @returns {Function} 取消订阅的函数
   */
  subscribe(listener) {
    this.listeners.push(listener);

    // 返回取消订阅函数
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx > -1) {
        this.listeners.splice(idx, 1);
      }
    };
  }

  /**
   * 通知所有监听器状态已变更
   * @private
   */
  notify() {
    const state = this.getState();
    this.listeners.forEach(fn => fn(state));
  }

  /**
   * 获取当前状态（Redux 风格）
   * @returns {Object} 当前状态对象
   * @property {boolean} canUndo - 是否可以撤销
   * @property {boolean} canRedo - 是否可以重做
   * @property {number} undoCount - 可撤销命令数
   * @property {number} redoCount - 可重做命令数
   * @property {Command|null} lastCommand - 最后一个执行的命令
   */
  getState() {
    return {
      canUndo: this.past.length > 0,
      canRedo: this.future.length > 0,
      undoCount: this.past.length,
      redoCount: this.future.length,
      lastCommand: this.past[this.past.length - 1] || null,
    };
  }

  /**
   * 清空所有历史记录
   */
  clear() {
    this.past = [];
    this.future = [];
    this.notify();
  }
}
