import { legacy } from "./../../lib/";

describe('Simple chain', () => {
  it ('Must return last yielded value', () => {
    function* testChain() {
      yield 'A';
      yield 'B';
      yield 'C';
    }
    return legacy(testChain)
    .then(function(v) {
      expect(v).toBe('C');
    });
  });
});
