import { legacy } from "./../../lib/";

describe('Throw error', () => {
  it ('Throwed error must be rejected', () => {
    function* testChain() {
      let a = yield 1;
      throw new Error(2);
      yield b.message;
    }
    return legacy(testChain)
    .then(function() {
      expect(false).toBe(true);
    })
    .catch(function(v) {
      expect(v.message).toBe("2");
    });
  });

  it ('Promise Try / catch | catched', () => {
    function deliberateError() {
      return Promise.reject(new Error("Oups"));
    }
    function* testChain() {
      try {
        yield deliberateError;
      } catch(e) {
        yield 'Error catched';
      }
    }
    return legacy(testChain)
    .then(function(v) {
      expect(v).toBe('Error catched');
    });
  });

  it ('Promise Try / catch | uncatched', () => {
    const handler = jest.fn((v) => {
      expect(v.message).toBe("Oups");
      return true;
    });
    function deliberateError() {
      return Promise.reject(new Error("Oups"));
    }
    function* testChain() {
      yield deliberateError;
      yield 'Error catched';
    }
    return legacy(testChain)
    .catch(handler)
    .then(() => {
      expect(handler).toHaveBeenCalled();
    });
  });

  it ('Inline throw Try / catch | catched', () => {
    function deliberateError() {
      return Promise.reject(new Error("Oups"));
    }
    function* testChain() {
      try {
        throw new Error("Inline error");
        yield 7;
      } catch(e) {
        yield 'Error catched';
      }
    }
    return legacy(testChain)
    .then(function(v) {
      expect(v).toBe('Error catched');
    });
  });

  it ('Inline throw Try / catch | uncatched', () => {
    const handler = jest.fn((v) => {
      expect(v.message).toBe("Inline error");
      return true;
    });
    function deliberateError() {
      return Promise.reject(new Error("Oups"));
    }
    function* testChain() {
      throw new Error("Inline error");
      yield 7;
      yield 'Error catched';
    }
    return legacy(testChain)
    .catch(handler)
    .then(() => {
      expect(handler).toHaveBeenCalled();
    });
  });
});
