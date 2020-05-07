import React, { createContext, useReducer } from 'react';

const initialState = {
  blackCard: {},
  bottomRowCards: [],
  selectedCards: {},
  topRowCards: [],
  showSubmit: false,
};

const GameContext = createContext(initialState);

const GameStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'SET_BLACK_CARD':
        return { ...state, blackCard: action.data };
      case 'SET_BOTTOM_ROW':
        return { ...state, bottomRowCards: action.data };
      case 'SET_SELECTED_CARDS':
        return { ...state, selectedCards: action.data };
      case 'SET_TOP_ROW':
        return { ...state, topRowCards: action.data };
      case 'SHOW_SUBMIT':
        return { ...state, showSubmit: action.data };
      default:
        throw new Error();
    }
  }, initialState);

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
};

export { GameContext, GameStateProvider };
