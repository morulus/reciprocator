import { legacy } from "./../../lib/";

function* subSequencies() {
  yield 5;
  yield 6;
  yield 7;
}

describe('Test sub generators', () => {
  it ('Sub generator must resolve last yielded value', () => {
    function* testSequence() {
      let a = yield 1;
      let b = yield subSequencies;
      yield a + b;
    }
    return legacy(testSequence)
    .then(function(v) {
      expect(v).toBe(8);
    });
  });
});
