import singular from "./../lib/singular";

describe('Simple chain', () => {
  it ('Must return last yielded value', () => {
    function* testChain() {
      yield 'A';
      yield 'B';
      yield 'C';
    }
    return singular(testChain)
    .then(function(v) {
      expect(v).toBe('C');
    });
  });

  it ('Must return summ of all yielded promise values', () => {
    function* testPromiseChain() {
      let a = yield Promise.resolve(1);
      let b = yield Promise.resolve(10);
      let c = yield Promise.resolve(100);
      yield a + b + c;
    }
    return singular(testPromiseChain)
    .then(function(v) {
      expect(v).toBe(111);
    });
  });

  it ('Must reject with custon error message', () => {
    function* testPromiseChainWithError() {
      let a = yield Promise.resolve(1);
      let b = yield Promise.resolve(10);
      let c = yield Promise.resolve(100);
      throw new Error("Oups");
      yield a + b + c;
    }
    return singular(testPromiseChainWithError)
    .catch(function(e) {
      expect(e.message).toBe("Oups");
    });
  });

  it ('Yield reject', () => {
    function* testPromiseChainWithError() {
      let a = yield Promise.reject(new Error("Oups"));
      let b = yield Promise.resolve(10);
      let c = yield Promise.resolve(100);
      throw new Error("Oups");
      yield a + b + c;
    }
    return singular(testPromiseChainWithError)
    .catch(function(e) {
      expect(e.message).toBe("Oups");
    });
  });
});
