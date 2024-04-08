const promise = new myPromise((resolve, reject) => {
  setTimeout(() => {
    // Math.random() < 0.5 ? resolve(12) : reject(new Error("rejected"));
    resolve(12);
  }, 500);
})
  .then(2)
  .then(3)
  .then((value) => {
    console.log("value", value);
  });
