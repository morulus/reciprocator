import { apply, create, effects } from "../../src/";

describe('Context', () => {
  it ('Child app follows parent context', () => {
    const context = {};

    const someApp = create(jest.fn(function* () {
      const ctx = yield effects.getContext();
      expect(this).toBe(context);
    }))

    const flow = jest.fn(function* (a, b, c) {
      yield someApp;
      return a + b + c;
    })

    return apply(flow, context, [1, 2, 3])
    .then(result => expect(result).toBe(6))
  });

  it ('Application wont throw up where there is no context', () => {
    const appRequiresContext = function* contextUser() {
      const ctx = yield effects.getContext();
      expect(ctx).toBe(null);
      return 17;
    }

    return apply(appRequiresContext)
      .then(result => expect(result).toBe(17))
  })
});
