Add todo to json file
--

_Behavior:_
- The user enters a string via terminal;
- Read target json file, add user input to the array, write it back.
- As user for input again

_Helpers:_
- `dialog` Prompt interface
- `editJsonFile` Json file r/w API

```js
import { dialog } from 'reflexive-terminal';
import { editJsonFile } from 'reflexive-fs';
```

```js
export default function addTodo(filename) {
  return function* () {
    do {
      const todo = yield dialog({
        type: 'input',
        message: 'Enter todo',
        default: ''
      });
      if (todo) {
        yield editJsonFile(filename, content => content.concat([todo]));
      }
    } while(todo);
  }
}
```

`addTodo` allows you to prepare any number of generators for different files.

```js
export const addHomeTodo = addTodo('./homeTodo.json');
export const addWorkTodo = addWorkTodo('./workTodo.json');
```

## Usage

Via run:
```js
import { run } from 'reflexive';
run(addHomeTodo);
```

Via another generator:
```js
import { run } from 'reflexive';
function* todo() {
  yield addHomeTodo;
  yield addWorkTodo;
}
run(todo);
```

Via __opera__:
```shell
opera todo.js
```

## Note

`editJsonFile` resolves filename relative to `process.env.cwd`. If the script work with a different directory, you should specify a location via store.

```js
import { run, ENV } from 'reflexive';
run(todo, {}, {
  [ENV]: {
    PWD: './path/to/folder'
  }
});
```

```js
export default (filename) => run(addHomeTodo, {}, createEnvStore({}, ));
```
