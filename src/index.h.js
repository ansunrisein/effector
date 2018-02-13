//@flow

import {Stream} from 'most'
import type {Store} from 'redux'

type Handler<S, P, M={}> = (state: S, payload: P, meta?: M) => S

type RawAction<+P, +M = {}> = {
  +type: string,
  +payload: P,
  +meta?: M
}

export /*::opaque*/ type Tag = string
export /*::opaque*/ type ID = number

export type Domain<State = void> = {
  effect<Params, Done, Fail>(
    name: string
  ): Effect<Params, Done, Fail, State>,
  event<Payload>(
    name: string
  ): Event<Payload, State>,
  domain(name: string): Domain<State>,
  typeConstant<Payload>(
    name: string
  ): Event<Payload, State>,
  register: (store: Store<State>) => void,
}

export type Event<Payload, State> = {
  (params: Payload): {
    send(dispatchHook?: <T>(value: T) => T): Promise<Payload>,
    raw(): RawAction<Payload, any>,
  },
  getType(): Tag,
  watch<R>(fn: (params: Payload, state: State) => R): void,
  epic<R>(
    handler: (
      data$: Stream<Payload>,
      state$: Stream<State>
    ) => Stream<R>
  ): Stream<R>,
}

export type Effect<Params, Done, Fail, State> = {
  (params: Params): {
    send(dispatchHook?: <T>(value: T) => T): Promise<Params>,
    done(): Promise<{params: Params, result: Done}>,
    fail(): Promise<{params: Params, error: Fail}>,
    promise(): Promise<{params: Params, result: Done}>,
  },
  getType(): Tag,
  watch<R>(fn: (params: Params, state: State) => R): void,
  epic<R>(
    handler: (
      data$: Stream<Params>,
      state$: Stream<State>
    ) => Stream<R>
  ): Stream<R>,
  use(thunk: (params: Params) => Promise<Done>): void,
  done: {
    epic<R>(
      handler: (
        data$: Stream<{params: Params, result: Done}>,
        state$: Stream<State>
      ) => Stream<R>
    ): Stream<R>,
    watch<R>(
      handler: (
        data: {params: Params, result: Done},
        state: State,
      ) => R
    ): void,
  },
  fail: {
    epic<R>(
      handler: (
        data$: Stream<{params: Params, error: Fail}>,
        state$: Stream<State>
      ) => Stream<R>
    ): Stream<R>,
    watch<R>(
      handler: (
        data: {params: Params, error: Fail},
        state: State,
      ) => R
    ): void,
  },
}

export type Reducer<S> = {
  (state?: S, action: RawAction<any, any>): S,
  options(opts: { fallback: boolean }): Reducer<S>,
  has(event: Event<any, any>): boolean,
  on<
    P, M,
    A/*: Event<P, any> | $ReadOnlyArray<Event<any, any>>*/
  >(event: A, handler: (state: S, payload: P, meta?: M) => S): Reducer<S>,
  off<
    A/*: Event<any, any> | $ReadOnlyArray<Event<any, any>>*/
  >(event: A): Reducer<S>,
  reset<
    A/*: Event<any, any> | $ReadOnlyArray<Event<any, any>>*/
  >(event: A): Reducer<S>
}

export type Handlers<S> = {
  [propertyName: string]: Handler<S, any, any>
}

type functionOn<S, P, M={}> = (actionCreator: Event<P, any>, handler: Handler<S, P, M>) => Reducer<S>
type functionOff<S> = (actionCreator: Event<any, any>) => Reducer<S>

export type OnOff<S> = {
  (on: functionOn<S, any, any>, off: functionOff<S>): void;
}


export const counter = (): () => ID => {
  let id: ID = 0
  return (): ID => ++id
}

export function toTag(...tags: $ReadOnlyArray<string | Tag>): Tag {
  return tags
    .filter(str => str.length > 0)
    .join('/')
}
