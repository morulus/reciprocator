import singular from "./../lib/singular";

describe('Throw error', () => {
  it ('Throwed error must be rejected', () => {
    function* testChain() {
      let a = yield 1;
      throw new Error(2);
      yield b.message;
    }
    return singular(testChain)
    .then(function() {
      expect(false).toBe(true);
    })
    .catch(function(v) {
      expect(v.message).toBe("2");
    });
  });

  it ('Returned error must be resolved', () => {
    function* testChain() {
      let a = yield 1;
      let b = yield new Error("Hello");
      yield b.message;
    }
    return singular(testChain)
    .then(function(v) {
      expect("Hello").toBe(v);
    })
    .catch(function(v) {
      expect(false).toBe(true);
    });
  });
});
