import { legacy } from "./../../lib/";
import { CANCEL } from "./../../lib/legacy/constants";

describe('Cancellable generators', () => {
  it ('Must return finally value', () => {
    function* cancellableChain() {
      try {
        while ( true ) {
          yield new Promise(resolve => setTimeout(resolve, 99999));
        }
      } finally {
        yield 'D';
      }
    }
    const wait = legacy(cancellableChain);
    wait[CANCEL]();
    wait.then(function(v) {
      expect(v).toBe('D');
    });
  });

  it ('Must return finally custom value', () => {
    function* cancellableChain() {
      try {
        while ( true ) {
          yield new Promise(resolve => setTimeout(resolve, 99999));
        }
      } finally {
        yield 'D';
      }
    }
    const wait = legacy(cancellableChain);
    wait[CANCEL](5);
    wait.then(function(v) {
      expect(v).toBe(5);
    });
  });
});

describe('Cancellable promises', () => {
  it ('Must be resolved with undefined', () => {
    function cancellablePromise() {
      return new Promise(resolve => setTimeout(() => resolve(1), 1000));
    }
    const wait = legacy(cancellablePromise);
    wait[CANCEL]();
    return wait.then(function(v) {
      expect(v).toBe(undefined);
    });
  });

  it ('Must be resolved with 5', () => {
    function cancellablePromise() {
      return new Promise(resolve => setTimeout(() => resolve(1), 1000));
    }
    const wait = legacy(cancellablePromise);
    wait[CANCEL](5);
    return wait.then(function(v) {
      expect(v).toBe(5);
    });
  });
});
