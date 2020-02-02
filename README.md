# useReducest

`useReducest` is a custom hook for React, that extends [React's `useReducer` hook](https://reactjs.org/docs/hooks-reference.html#usereducer) with a fourth (optional) parameter: middlewares.
`useReducest` is compatible with any existing implementation of `React.useReducer`.
Middlewares are expected to conform to the [Redux Middleware API](https://redux.js.org/advanced/middleware/).
`useReducest` lets you add existing Redux middlewares to existing `React.useReducer` hooks, without having to refactor the useReducer implementation nor the middlewares.

## API

```js
const [state, dispatch] = useReducest(
  reducer,
  initialArg,
  init,
  middlewares
);
```

### `reducer`, `initialArg`, `init` (_optional_)
The first three parameters are equivalent to [React's `useReducer` hook](https://reactjs.org/docs/hooks-reference.html#usereducer).
The `init` function is optional and you can pass value `undefined` in case you want to provide middlewares as a fourth parameter.

### `middlewares: Middleware[]` (_optional_)
`middlewares` expects an array of middlewares that will be applied left-to-right.
This means the `next` function in a middleware will call the middleware to its right in the list in case there is one or the reducer.
The interface of a middleware is:

```ts
type Middleware = (store: {
  dispatch: (action: Action) => Action,
  getState: () => State,
}) =>
  (next: (action: Action) => Action) =>
    (action: Action) => void;
```

## Reference stability on re-rendering
`useReducest` allows you to change the `reducer` and `middlewares` after the state is initialised.
As a result, the returned `dispatch` function will have a new reference in case the `reducer` or any of the `middlewares` has changed.
As `dispatch` functions are typically passed down to many child components, it is important to update the `reducer` and `middlewares` only when necessary.

## Usage example
Here's an extended version of React's Counter component example to clarify best-practices:

```js
const initialState = {count: 0};

// Reducer is defined outside of functional component, reference is stable.
function reducer(state, action) {
  switch (action.type) {
    case 'incrementBy':
      return {count: state.count + action.payload};
    case 'decrementBy':
      return {count: state.count - action.payload};
    default:
      throw new Error();
  }
}

// Middleware is defined outside of functional component, reference is stable
const logDiff = (store) => (next) => (action) => {
  console.log(`Value was ${store.getState().count}.`);
  next(action);
  console.log(`Value is now ${store.getState().count}.`);
};

function Counter() {
  const [factor, setFactor] = React.useState(1);

  // applyFactor, and as a result dispatch, will only change when factor changes
  const applyFactor = React.useCallback((store) => (next) => (action) => {
    switch (action.type) {
      case 'increment':
        next({
          type: 'incrementBy',
          payload: factor,
        });
        return;
      case 'decrement':
        next({
          type: 'decrementBy',
          payload: factor,
        });
        return;
      default:
        next(action);
        return;
    }
  }, [factor]);

  const [state, dispatch] = useReducest(reducer, initialState,  undefined, [applyFactor, logDiff]);
  return (
    <>
      Count: {state.count}
      <button onClick={() => dispatch({type: 'decrement'})}>-</button>
      <button onClick={() => dispatch({type: 'increment'})}>+</button>
      <input
        onChange={(event) => setFactor(parseInt(event.target.value, 10))}
        step='1'
        type='number'
        value={factor}
      />
    </>
  );
}
```

## Q&A

### What is the difference between `useReducest` and `react-use`'s `createReducer`?
`useReducest` is heavily inspired by `react-use`'s `createReducer` custom hook.
The biggest difference between `useReducest` and `createReducer` is that when using `createReducer`, middlewares may not be changed after state initialisation.
If all of your middlewares are stable, `createReducer` will give you the best performace and cleanest code.