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
  #result = undefined; //返回结果
  #handler = []; // 接收then方法的参数已经then方法中返回的promise对象汇总的resolve和reject
  // 判断返回的类型是否是promise
  #isPromiseLike(value) {
    if (
      (value !== null && typeof value === "function") ||
      typeof value === "object"
    ) {
      return typeof value.then === "function";
    } else {
      return false;
    }
  }
  // 微队列任务函数
  #runMicroTask(fn) {
    // 微队列任务得分环境 node环境 、 浏览器环境
    // node环境
    if (typeof process === "object" && typeof process.nextTick === "function") {
      process.nextTick(fn);
    } else if (typeof MutationObserver === "function") {
      const ob = new MutationObserver(fn);
      const textNode = document.createTextNode("1");
      ob.observe(textNode, {
        characterData: true,
      });
      textNode.data = "2";
    } else {
      setTimeout(fn, 0);
    }
  }
  #run() {
    /**
     * 只有当上一个promise的状态发生改变的时候才可以调用then方法
     */
    if (this.#status === PENDING) return;
    while (this.#handler.length) {
      const { onFulfilled, onRejected, resolve, reject } =
        this.#handler.shift();
      if (this.#status === FULFILLED) {
        this.#runOne(onFulfilled, resolve, reject);
      } else if (this.#status === REJECTED) {
        this.#runOne(onRejected, resolve, reject);
      }
    }
  }
  #runOne(callback, resolve, reject) {
    this.#runMicroTask(() => {
      // 判断用户使用then方法时必须传递函数
      if (typeof callback !== "function") {
        const settled = this.#status === FULFILLED ? resolve : reject;
        settled(this.#result);
        return;
      } else {
        // 如果then方法的成功的参数不是一个函数 而是其他的值 将向上穿透获取上一级resolve传入的值
        try {
          const result = callback(this.#result);
          // 如果返回的结果是一个promise对象 则需要解包
          if (this.#isPromiseLike(result)) {
            result.then(resolve, reject);
          } else {
            resolve(result);
          }
        } catch (error) {
          reject(error);
        }
      }
    });
  }
  /**
   *
   * @param {*} status 状态
   * @param {*} data 结果
   */
  #changeStatus = (status, data) => {
    // 当promise的状态不为pending的时候才会执行接下来的代码
    if (this.#status !== PENDING) return;
    this.#status = status;
    this.#result = data;
    this.#run();
  };
  /**
   * then方法返回的依然是一个promise对象
   * @param {*} onFulfilled 成功的回调函数
   * @param {*} onRejected 失败的回调函数
   * @returns
   */
  then = (onFulfilled, onRejected) => {
    return new myPromise((resolve, reject) => {
      this.#handler.push({
        onFulfilled,
        onRejected,
        resolve,
        reject,
      });
      this.#run();
    });
  };
  // 定义
  constructor(executor) {
    //成功
    const resolve = (success) => {
      this.#changeStatus(FULFILLED, success);
    };
    //失败
    const reject = (error) => {
      this.#changeStatus(REJECTED, error);
    };

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
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }
}

const p = new myPromise((resolve, reject) => {
  reject(123);
});
p.then(
  (res) => {
    console.log("成功的回调1", res);
    return 999;
  },
  (err) => {
    console.log("err", err);
    return new Promise((resolve, reject) => {
      reject("哈哈哈");
    });
  }
).then(
  (res) => {
    console.log(res);
  },
  (err) => {
    console.log(err);
  }
);
