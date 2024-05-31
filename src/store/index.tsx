"use client";
import { createContext, useReducer } from "react";

const initialState: any = {

};

const store = createContext(initialState);
const { Provider } = store;

const StateProvider = ({ children }: {children: any} ) => {
  const [state, dispatch] = useReducer((state: any, action: any) => {
    switch (action.type) {
      case 'SET_USER':
        return { 
          ...state, 
          ...action.payload
        };
      default:
        throw new Error();
    }
  }, initialState);
  return <Provider value={{ state, dispatch }}>{children}</Provider>;
};

export { store, StateProvider };