import singular from "./../lib/singular";
import { RESTANTE } from "./../lib/constants";

function* getFn() {
  const fn = function(a, b) {
    return a + b;
  };
  fn[RESTANTE] = true;
  yield fn;
}

describe('Test sub generators', () => {
  it ('Sub generator must resolve last yielded value', () => {
    function* testSequence() {
      let a = yield 1;
      let b = yield 2;
      let fn = yield getFn;
      expect(typeof fn).toEqual('function');
      expect(a).toEqual(1);
      expect(b).toEqual(2);
      yield fn(a, b);
    }
    return singular(testSequence)
    .then(function(v) {
      expect(v).toBe(3);
    });
  });
});
