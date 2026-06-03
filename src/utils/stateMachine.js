import { ref } from "vue";

export class StateMachine {
  /**
   * 创建一个状态机
   * @param {String} stateMachineName 状态机名称
   */
  constructor(stateMachineName) {
    this.stateMachineName = stateMachineName;
    this.currentState = ref(null);
    this.statesMap = new Map();
    this.context = {};
  }

  getStateRef() {
    return this.currentState;
  }

  getCurrentState() {
    return this.currentState.value;
  }

  getName() {
    return this.stateMachineName;
  }

  /**
   * 添加一个状态，重复添加已有状态将会覆盖该状态的Actions
   * @param {String} stateName 状态名
   * @param {Function} enterAction 进入状态函数
   * @param {Function} updateAction 更新状态/业务逻辑函数
   * @param {Function} quitAction 退出状态函数
   * @returns 状态机自身实例，用于链式调用
   */
  addState(stateName, enterAction, updateAction, quitAction) {
    this.statesMap.set(stateName, {
      enterAction,
      updateAction,
      quitAction,
    });
    return this;
  }

  /**
   * 移除状态
   * @param {String | Array} stateName 状态名或由状态名组成的数组
   */
  removeState(stateName) {
    if (Array.isArray(stateName)) {
      for (const sn of stateName) {
        this.statesMap.delete(sn);
      }
    } else {
      this.statesMap.delete(stateName);
    }
  }

  _checkState(stateName) {
    if (!this.statesMap.has(stateName)) {
      throw new Error(
        `No state called "${stateName}" found in state machine: "${this.stateMachineName}"`,
      );
    }
  }

  /**
   * 切换状态机的状态
   * @param {any} stateName 要切换到的状态
   * @param {any} data 传递给新状态的上下文
   * @param {boolean} checkSameState 检查目标状态与当前状态是否一致，如果为false，则即使新状态等于当前状态也会进行切换
   * @returns
   */
  changeCurrentState(stateName, data, checkSameState = true) {
    if (checkSameState && this.currentState.value === stateName) {
      return;
    }

    console.debug("change to:", stateName);

    this._checkState(stateName);

    // 如果上一个状态存在，运行其quit函数
    if (this.currentState.value) {
      this.statesMap
        .get(this.currentState.value)
        .quitAction?.(stateName, this.context);
    }

    // 切换状态
    const prevState = this.currentState;
    this.currentState.value = stateName;

    // 运行新状态的enter函数
    this.statesMap
      .get(this.currentState.value)
      .enterAction?.(prevState, this.context, data);
  }

  run(data) {
    this._checkState(this.currentState.value);
    this.statesMap
      .get(this.currentState.value)
      ?.updateAction(this.context, data);
  }

  /**
   * 设置状态机的上下文，本质是将传入的参数与已有的上下文对象进行浅合并。
   * 将某个属性设置为undefined会删除该属性。
   * @param {Object} ctx 要合并的上下文
   */
  setCustomContext(ctx) {
    this.context = Object.fromEntries(
      Object.entries({
        ...this.context,
        ...ctx,
      }).filter(([_, val]) => val !== undefined),
    );
  }

  /**
   * 获取状态机的自定义上下文
   * @returns 一个对象
   */
  getCustomContext() {
    return this.context;
  }

  /**
   * 清空自定义上下文
   */
  clearCustomContext() {
    this.context = null;
  }
}
