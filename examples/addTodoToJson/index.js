import { run } from 'icecoffee';
import { editJsonFile } from 'icecoffee-fs';

return function* addTodo(props) {
  do {
    const todo = yield dialog({
      type: 'input',
      message: 'Enter todo',
      default: ''
    });
    if (todo) {
      yield editJsonFile(props.filename, function(content) {
        return content.concat([todo]);
      });
    }
  } while(todo);
}

export default (filename) => (state, store) => run(addTodo, {
  filename
}, store);
