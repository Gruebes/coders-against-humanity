import React, { createContext, useReducer } from 'react';

const initialState = {
  allPlayers: [],
  blackCard: {},
  currentCzar: {},
  playerCards: [],
  selectedCards: {},
  showSubmit: false,
  trading: false,
};

const GameContext = createContext(initialState);

const GameStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'SET_ALL_PLAYERS':
        return { ...state, allPlayers: action.data };
      case 'SET_BLACK_CARD':
        return { ...state, blackCard: action.data };
      case 'SET_CURRENT_CZAR':
        return { ...state, currentCzar: action.data };
      case 'SET_SELECTED_CARDS':
        return { ...state, selectedCards: action.data };
      case 'SET_PLAYER_CARDS':
        return { ...state, playerCards: action.data };
      case 'SHOW_SUBMIT':
        return { ...state, showSubmit: action.data };
      case 'TRADING':
        return { ...state, trading: action.data };
      default:
        throw new Error();
    }
  }, initialState);

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
};

export { GameContext, GameStateProvider };
