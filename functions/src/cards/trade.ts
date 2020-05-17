import * as functions from 'firebase-functions';
import * as Promise from 'bluebird';
import * as admin from 'firebase-admin';

export const tradeCards = functions.https.onCall(async (data, context) => {
  const { _gameId, _playerId, selectedCards } = data;
  console.log('data', data);
  const playerRef = admin.firestore().collection('/players').doc(_playerId);
  const playerSnapshot = await playerRef.get();
  const playerData = playerSnapshot.data() || {};
  console.log('playerData', playerData);
  const selectedEntries = Object.entries(selectedCards);
  console.log('selectedEntries', selectedEntries);
  const whiteEntriesToRepl = Object.entries(playerData.whiteCards).filter(([index, card]: any) =>
    selectedEntries.find(([i, c]: any) => c.index === card.index)
  );
  console.log('whiteEntriesToRepl', whiteEntriesToRepl);

  // transaction for switching cards between ledger and player
  await admin.firestore().runTransaction(async t => {
    console.log('beginning transaction');
    console.log('Getting Ledger');
    const ledgerRef = admin.firestore().collection('/game_ledgers').doc(_gameId);
    const ledgerSnapshot = await t.get(ledgerRef);
    const ledgerData: any = ledgerSnapshot.data();

    // get the first avaiable white cards from ledger according to whiteEntriesToRepl.length
    const useCards = Object.entries(ledgerData.whiteCards)
      .filter(([cardIndex, val]: any) => val.delt_to === null)
      .slice(0, whiteEntriesToRepl.length);
    // mark the new cards on the ledger
    useCards.forEach(([cardIndex, val]) => {
      ledgerData.whiteCards[cardIndex].delt_to = _playerId;
    });
    console.log('useCards', useCards);

    // t.get those cards
    const newCards = await Promise.map(useCards, async ([index, useCardData]: any) => {
      const cardIndex = useCardData.index;
      const cardRef = admin.firestore().collection('/white_cards').doc(`${cardIndex}`);
      const cardData = (await t.get(cardRef)).data();
      return cardData;
    });
    console.log('newCards', newCards);

    // replace those on the players deck
    whiteEntriesToRepl.forEach(([whiteIdx, whiteEnt], index) => {
      playerData.whiteCards[whiteIdx] = newCards[index];
    });
    // update that on the players doc
    console.log('Updating Player', playerData);
    await t.update(playerRef, { whiteCards: playerData.whiteCards, selectedCards });
    // update ledger
    console.log('Updating ledger');
    return await t.update(ledgerRef, { whiteCards: ledgerData.whiteCards });
  });

  const playerSnapshots = await admin
    .firestore()
    .collection('players')
    .where('_gameId', '==', _gameId)
    .get();
  console.log('checking if all players have selected...');

  const playersData = playerSnapshots.docs.map(doc => ({ ...doc.data(), _id: doc.id }));
  const allPlayersSubmitted = playersData.every((p: any) => Object.keys(p.selectedCards).length);

  const gameRef = admin.firestore().collection('/games').doc(_gameId);
  const gameData: any = (await gameRef.get()).data();

  console.log(`allPlayersSubmitted=${allPlayersSubmitted}`);
  console.log(`Current state=${gameData.state}`);
  if (gameData.state === 3 && allPlayersSubmitted) {
    // if so, set the game state to selectBlack
    console.log(`updating state to chooseBlack:4`);
    await gameRef.update({ state: 4 });
  }

  return { status: 'ok!' };
});
