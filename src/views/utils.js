import { gameStateTypes } from '../enums';
import firebase from '../firebase';

export const getPlayerObject = (currentUser, _id, _gameId, isHost = false) => {
  return {
    _id,
    _gameId,
    blackCardsWon: 0,
    created_at: firebase.firestore.Timestamp.now(),
    displayName: currentUser.profile.displayName,
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
export const getUserObject = user => {
  return {
    blackCardsWon: {},
    uid: user.uid,
    profile: {
      displayName: user.displayName,
      pic: null,
    },
  };
};

export const getGameObject = (currentUser, cardsToWin, playerLimit, czarId, _id) => {
  const { uid, email, displayName } = currentUser;
  return {
    _id,
    blackCount: 0,
    cardsToWin,
    chat: {
      chat: true,
    },
    currentTurn: {
      czar: czarId,
      blackCard: null,
    },
    host_user: {
      uid,
      email,
      displayName,
    },
    playerLimit,
    players: {
      [`${czarId}`]: firebase.firestore.Timestamp.now(),
    },
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
