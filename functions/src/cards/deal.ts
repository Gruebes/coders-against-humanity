import * as functions from 'firebase-functions';
import * as Promise from 'bluebird';
import * as admin from 'firebase-admin';

export const dealCards = functions.https.onCall(async (data, context) => {
  const _gameId = data._gameId;
  console.log('data', data);
  console.log('_gameId', _gameId);
  const config: any = (await admin.firestore().collection('/config').get()).docs.map(doc => ({
    ...doc.data(),
    _id: doc.id,
  }))[0];
  console.log('Received Config', config);
  console.log('Shuffling');
  const shuffledBlack = fisherYatesShuffle(getCardIndexes(config.blackCount));
  const shuffledWhite = fisherYatesShuffle(getCardIndexes(config.whiteCount));
  // create game deck
  const gameLedger = getGameDeck(shuffledBlack, shuffledWhite);
  console.log('Created Ledger');
  // set players white cards
  console.log('Create white card maps');
  await createPlayersWhiteCardsMap(gameLedger, _gameId);

  // TODO: getting the same black card each time
  const blackIndex = shuffledBlack[0];
  const blackCard = (
    await admin.firestore().collection('/black_cards').doc(`${blackIndex}`).get()
  ).data();
  console.log('blackCard', blackCard);
  // mark this card on game deck
  gameLedger.blackCards[0].delt = true;

  // TRANSACTION?
  // set game ledger
  console.log('Updating Ledger');
  await admin.firestore().collection('/game_ledgers').doc(_gameId).set(gameLedger);
  // update black card on game
  console.log('Updating Game');
  await admin.firestore().collection('/games').doc(_gameId).update({
    'currentTurn.blackCard': blackCard,
    state: 3,
  });

  return { status: 'ok' };
});

const createPlayersWhiteCardsMap = async (ledgerData: any, _gameId: string) => {
  const players = await admin
    .firestore()
    .collection('/players')
    .where('_gameId', '==', _gameId)
    .get();
  const batch = admin.firestore().batch();

  // build up player decks
  await Promise.each(players.docs, async (player: any) => {
    // get 10 cards from deck
    const useCards = Object.entries(ledgerData.whiteCards)
      .filter(([cardIndex, val]: any[]) => val.delt_to === null)
      .slice(0, 10);
    // card indexes for query
    const cardIdxs = useCards.map((c: any) => c[1].index);
    console.log('useCards', useCards);

    useCards.forEach(([cardIndex, val]) => {
      // mark the card on the game_deck ledger (modifies in place)
      ledgerData.whiteCards[cardIndex].delt_to = player.id;
    });
    const cardsSnapShot = await admin
      .firestore()
      .collection('/white_cards')
      .where('index', 'in', cardIdxs)
      .get();
    console.log('cardsSnapShot', cardsSnapShot);

    const playersCards: any = {};
    cardsSnapShot.docs.forEach((card: any, index: number) => {
      const cardData = card.data();
      // set players starting cards
      playersCards[index] = cardData;
    });
    console.log('playersCards', playersCards);

    const playerRef = admin.firestore().collection('/players').doc(player.id);
    return batch.update(playerRef, { whiteCards: playersCards });
  });

  // Commit the batch
  return batch.commit();
};

const fisherYatesShuffle = (deck: any) => {
  const theLength = deck.length - 1;
  let toSwap;
  let tempCard;

  for (let i = theLength; i > 0; i--) {
    toSwap = Math.floor(Math.random() * i);
    tempCard = deck[i];
    deck[i] = deck[toSwap];
    deck[toSwap] = tempCard;
  }
  return deck;
};

const getCardIndexes = (count: number) => {
  const indexArray = [];
  for (let i = 0; i <= count; i++) {
    indexArray.push(i);
  }
  return indexArray;
};

const getGameDeck = (blackCards: any, whiteCards: any) => {
  return {
    blackCards: blackCards.reduce((acc: any, index: number, idx: number) => {
      acc[idx] = { index, delt: null };
      return acc;
    }, {}),
    whiteCards: whiteCards.reduce((acc: any, index: number, idx: number) => {
      acc[idx] = { index, delt_to: null };
      return acc;
    }, {}),
  };
};
