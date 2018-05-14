import { legacy } from "./../../lib/";

describe('Throw error', () => {
  it ('The result should be OK', () => {
    function* testDoubleErrorHandle() {
      let a = yield 1;
      try {
        throw new Error('Error 1');
      } catch(e) {
        try {
          throw new Error('Error 2')
        } catch(e) {
          try {
            return z; // z is undefined
          } catch(e) {
            yield 'OK_@';
          }
        }
      }
    }

    function* app() {
      yield testDoubleErrorHandle;
    }
    return legacy(app)
    .then(function(result) {
      expect(result).toBe('OK_@');
    })
    .catch(function(v) {
      expect(true).toBe(false);
    });
  });
});
