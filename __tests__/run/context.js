import { apply, create, effects } from "erector";

describe('Context', () => {
  it ('Child app follows parent context', () => {
    const context = {};

    const someApp = create(jest.fn(function* () {
      const ctx = yield effects.context;
      expect(this).toBe(context);
    }))

    const flow = jest.fn(function* (a, b, c) {
      yield someApp;
      return a + b + c;
    })

    return apply(flow, context, [1, 2, 3])
    .then(result => expect(result).toBe(6))
  });

  // it('Child app with child context', () => {
  //   const context = {
  //     a: 4
  //   };
  //
  //   const someApp = create(jest.fn(function* () {
  //     const ctx = yield context;
  //     expect(this).toBe(context);
  //   }))
  //
  //   const flow = jest.fn(function* (a, b, c) {
  //     yield someApp;
  //     return a + b + c;
  //   })
  //
  //   return apply(flow, context, [1, 2, 3])
  //   .then(result => expect(result).toBe(6))
  // })
});
