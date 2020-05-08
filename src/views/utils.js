import { gameStateTypes } from '../enums';
import firebase from '../firebase';

export const getPlayerObject = (currentUser, _gameId, isHost = false) => {
  return {
    _gameId,
    blackCardsWon: 0,
    created_at: firebase.firestore.Timestamp.now(),
    displayName: currentUser.displayName,
    ended_at: null,
    isHost,
    playerState: {
      connected: 1,
    },
    selectedCards: {},
    user_uid: currentUser.uid,
    whiteCards: {},
  };
};

export const getGameObject = (currentUser, cardsToWin, playerLimit, newPlayerId) => {
  const { uid, email, displayName } = currentUser;
  return {
    blackCount: 0,
    cardsToWin,
    chat: {
      chat: true,
    },
    currentTurn: { player: newPlayerId, blackCard: null },
    host_user: { uid, email, displayName },
    playerLimit,
    state: gameStateTypes.open,
    totalPlayers: 1,
    created_at: firebase.firestore.Timestamp.now(),
    ended_at: null,
  };
};

export const selectFromMiddle = deck => deck.splice(Math.floor(Math.random() * deck.length), 1)[0];

export const getDocsWithId = docs => {
  return docs.map(doc => ({ ...doc.data(), _id: doc.id }));
};
