import React, { createContext, useReducer } from 'react';

const initialState = {
  awaitingGame: false,
  cardsToWin: 7,
  game: null,
  isHost: false,
  openGames: [],
  playerCount: 4,
  player: null,
  playersAwaiting: [],
};

const store = createContext(initialState);
const { Provider } = store;

const StateProvider = ({ children }) => {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'SET_AWAITING_GAME':
        return { ...state, awaitingGame: action.data };
      case 'SET_CARDS_TO_WIN':
        return { ...state, cardsToWin: action.data };
      case 'SET_GAME':
        return { ...state, game: action.data };
      case 'SET_GAME_ID':
        return { ...state, _gameId: action.data };
      case 'SET_IS_HOST':
        return { ...state, isHost: action.data };
      case 'SET_OPEN_GAMES':
        return { ...state, openGames: action.data };
      case 'SET_PLAYER_CARDS':
        return { ...state, playerCards: action.data };
      case 'SET_PLAYER_COUNT':
        return { ...state, playerCount: action.data };
      case 'SET_PLAYER':
        return { ...state, player: action.data };
      case 'SET_PLAYER_ID':
        return { ...state, _playerId: action.data };
      case 'SET_OTHER_PLAYERS':
        return { ...state, otherPlayers: action.data };
      default:
        throw new Error();
    }
  }, initialState);

  return <Provider value={{ state, dispatch }}>{children}</Provider>;
};

export { store, StateProvider };
