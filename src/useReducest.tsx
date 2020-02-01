import * as React from 'react';

export interface Store<R extends React.Reducer<any, any>> {
  getState: () => React.ReducerState<R>;
  dispatch: React.Dispatch<React.ReducerAction<R>>;
}

export type Middleware<R extends React.Reducer<any, any>> = (store: Store<R>) =>
  (next: React.Dispatch<React.ReducerAction<R>>) =>
    (action: React.ReducerAction<R>) => void;

export const useReducest = <R extends React.Reducer<any, any>, I>(
  reducer: R,
  initializerArg: I,
  initializer: (arg: I) => React.ReducerState<R> = ((i: I) => i as React.ReducerState<R>),
  middlewares: Middleware<R>[] = []
): [React.ReducerState<R>, React.Dispatch<React.ReducerAction<R>>] => {
  const stateRef = React.useRef<React.ReducerState<R>>(initializer(initializerArg));
  const [, setState] = React.useState<React.ReducerState<R>>(stateRef.current);

  const updateState = React.useCallback<React.Dispatch<React.ReducerAction<R>>>(
    (action) => {
      stateRef.current = reducer(stateRef.current, action);
      setState(stateRef.current);
      return action;
    },
    [reducer]
  );

  const dispatch: React.Dispatch<React.ReducerAction<R>> = React.useCallback(
    middlewares.reduceRight(
      (
        next: React.Dispatch<React.ReducerAction<R>>,
        middleware: Middleware<R>
      ) => middleware
        .call(null, {
          getState: () => stateRef.current,
          dispatch: (action: React.ReducerAction<R>) => dispatch(action),
        })
        .call(null, next),
      updateState
    ),
    [updateState, ...middlewares]
  );

  return [stateRef.current, dispatch];
};