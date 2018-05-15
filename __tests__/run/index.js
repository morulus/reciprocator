import { run, apply } from "./../../lib";

describe('Simple chain', () => {
  it ('Sync', () => {
    const flow = jest.fn((a, b, c) => {
      return a + b + c;
    })

    const promise = run(flow, [1, 2, 3])
    .then((result) => {
      expect(result).toBe(6);
    });

    expect(flow).toHaveBeenCalled();

    return promise;
  });

  it ('Async', () => {
    const flow = jest.fn((a, b, c) => {
      return Promise.resolve(a + b + c);
    })

    const promise = run(flow, [1, 2, 3])
    .then((result) => {
      expect(result).toBe(6);
    });

    expect(flow).toHaveBeenCalled();

    return promise;
  });

  it('Access initial context from arrow function', () => {
    function setToContext(name, value) {
      return function() {
        this[name] = value;
      }
    }

    function getFromContext(name) {
      return function() {
        return this[name];
      }
    }

    const flow = function* (a) {
      yield setToContext('a', a * 2);
      yield getFromContext('a');
    }

    const context = {};

    return apply(flow, context, [5])
    .then((result) => {
      expect(result).toBe(10);
    })
  });
});
