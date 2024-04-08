// 手写promise(class版本)

/**
 * 定义promise初始状态(常量)
 */
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "REJECTED";

class myPromise {
  // #关键字声明的变量为私有变量 无法在外部访问以及修改
  #status = PENDING; //初始状态
  #value = undefined; //成功返回结果
  #reason = undefined; //失败返回结果
  #onFulfilledCallbacks = []; // 成功队列
  #onRejectedCallbacks = []; // 失败队列

  then(onFulfilled, onRejected) {
    // 如果传入的不是函数 则将上一个then的返回值作为参数传递给下一个then直到最后一个then可以接收到该参数
    onFulfilled =
      typeof onFulfilled === "function" ? onFulfilled : (value) => value;
    onRejected =
      typeof onRejected === "function"
        ? onRejected
        : (reason) => {
            throw new Error(reason);
          };

    //保存之前promise实例的引用 即保存this
    const self = this;
    // 链式调用
    return new myPromise((resolve, reject) => {
      if (self.#status === PENDING) {
        self.#onFulfilledCallbacks.push(() => {
          try {
            setTimeout(() => {
              const result = onFulfilled(self.#value);
              result instanceof myPromise
                ? result.then(resolve, reject)
                : resolve(result);
            });
          } catch (e) {
            reject(e);
          }
        });
        self.#onRejectedCallbacks.push(() => {
          try {
            setTimeout(() => {
              const result = onRejected(self.#reason);
              result instanceof myPromise
                ? result.then(resolve, reject)
                : resolve(result);
            });
          } catch (e) {
            reject(e);
          }
        });
      }
      if (self.#status === FULFILLED) {
        setTimeout(() => {
          try {
            const result = onFulfilled(self.#value);
            result instanceof myPromise
              ? result.then(resolve, reject)
              : resolve(result);
          } catch (e) {
            reject(e);
          }
        });
      }
      if (self.#status === REJECTED) {
        setTimeout(() => {
          try {
            const result = onRejected(self.#reason);
            result instanceof myPromise
              ? result.then(resolve, reject)
              : resolve(result);
          } catch (e) {
            reject(e);
          }
        });
      }
    });
  }

  catch(onRejected) {
    return this.then(undefined, onRejected);
  }

  static resolve(value) {
    if (value instanceof myPromise) return value;
    else {
      return new myPromise((resolve) => resolve(value));
    }
  }
  static reject(reason) {
    return new myPromise((_, reject) => reject(reason));
  }
  constructor(executor) {
    /**
     * 接收一个参数
     * 该参数为一个函数
     * 将promise "成功" 或者" 失败" 的结果作为参数传递进去
     */
    try {
      /**
       * 如果在执行该函数时出现异常 则promise的状态直接变为reject
       * #warning
       * 如果在函数体内部中执行了异步函数 在异步函数中发生了错误 promise无法捕捉 状态依然是pending！！！
       */
      const resolve = (value) => {
        if (this.#status === PENDING) {
          this.#status = FULFILLED;
          this.#value = value;
          // 成功态函数依次执行
          this.#onFulfilledCallbacks.forEach((fn) => fn(this.#value));
        }
      };

      const reject = (reason) => {
        if (this.#status === PENDING) {
          this.#status = REJECTED;
          this.#reason = reason;
          // 失败态函数依次执行
          this.#onRejectedCallbacks.forEach((fn) => fn(this.#reason));
        }
      };
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }
}
