import singular from "./../lib/singular";

function* subChain() {
  let a = yield new Promise(function(r) {
    setTimeout(() => {
      r(10);
    });
  });
  let b = a + 7;
  yield b;
}

describe('Deep chain', () => {
  it ('Must return last yielded value', () => {
    function* testChain() {
      let a = yield subChain;
      yield a + 3;
    }
    return singular(testChain)
    .then(function(v) {
      expect(v).toBe(20);
    });
  });
});
