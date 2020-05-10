import React, { createContext, useReducer } from 'react';

const initialState = {
  allPlayers: [],
  blackCard: {},
  currentTurn: {},
  playerCards: [],
  selectedCards: {},
  showSubmit: false,
};

const GameContext = createContext(initialState);

const GameStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'SET_ALL_PLAYERS':
        return { ...state, allPlayers: action.data };
      case 'SET_BLACK_CARD':
        return { ...state, blackCard: action.data };
      case 'SET_CURRENT_TURN':
        return { ...state, currentTurn: action.data };
      case 'SET_SELECTED_CARDS':
        return { ...state, selectedCards: action.data };
      case 'SET_PLAYER_CARDS':
        return { ...state, playerCards: action.data };
      case 'SHOW_SUBMIT':
        return { ...state, showSubmit: action.data };
      default:
        throw new Error();
    }
  }, initialState);

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
};

export { GameContext, GameStateProvider };
