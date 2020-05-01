import { gameStateTypes } from '../enums';
import firebase from '../firebase';

export const getPlayerObject = (currentUser, _gameId, isHost = false) => {
  return {
    blackCardsWon: 0,
    displayName: currentUser.displayName,
    playerState: {
      connected: 1,
    },
    selectedWhiteCards: {
      1: null,
      2: null,
      3: null,
    },
    user_uid: currentUser.uid,
    _gameId,
    isHost,
    created_at: firebase.firestore.Timestamp.now(),
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
  };
};

export const createRandomOrder = whiteCount => {
  const temp = [];
  for (var idx = 0; idx < whiteCount; idx++) {
    temp.push(idx);
  }
  let count = 0;
  const shuffled = [];
  while (count <= whiteCount) {
    let newArray = [];
    for (var i = 0; i < 50; i++) {
      let rand = Math.floor(Math.random() * temp.length);
      if (temp[rand] !== undefined) {
        newArray.push(temp[rand]);
        temp.splice(rand, 1);
      }
      count++;
    }
    shuffled.push(newArray);
  }
  return shuffled;
};

export const selectFromMiddle = deck => deck.splice(Math.floor(Math.random() * deck.length), 1)[0];

export const riffleShuffle = (deck, shuffleCount) => {
  for (let i = shuffleCount; i > 0; i--) {
    const cutDeckVariant = deck.length / 2 + Math.floor(Math.random() * 9) - 4;
    const leftHalf = deck.splice(0, cutDeckVariant);
    let leftCount = leftHalf.length;
    let rightCount = deck.length - Math.floor(Math.random() * 4);
    while (leftCount > 0) {
      const takeAmount = Math.floor(Math.random() * 4);
      deck.splice(rightCount, 0, ...leftHalf.splice(leftCount, takeAmount));
      leftCount -= takeAmount;
      rightCount = rightCount - Math.floor(Math.random() * 4) + takeAmount;
    }
    deck.splice(rightCount, 0, ...leftHalf);
  }
  return deck;
};
