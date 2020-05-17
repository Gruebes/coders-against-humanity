import * as functions from 'firebase-functions';
import * as Promise from 'bluebird';
import * as admin from 'firebase-admin';

export const chooseBlack = functions.https.onCall(async (data, context) => {
  const { currentBlackCard, player } = data;
  console.log('data', data);

  // start a 5 second promise that will resolve at the end, but not before 5 seconds
  const promise = new Promise(resolve => setTimeout(resolve, 5000));

  const gameRef = admin.firestore().collection('/games').doc(player._gameId);
  await gameRef.update({ 'currentTurn.winner': player.displayName });

  // update the user record with the winning card
  const userRef = admin.firestore().collection('/users').doc(player.user_uid);
  const userSnapshot = await userRef.get();
  const userData: any = userSnapshot.data();
  // update blackCards won
  const cardCount = userData.blackCardsWon[currentBlackCard.index];
  const newUserData = {
    [`blackCardsWon.${currentBlackCard.index}`]: cardCount ? cardCount + 1 : 1,
  };
  console.log('Update user with blackCard Won', newUserData);
  await userRef.update(newUserData);

  // update the player with the black card win
  const playerRef = admin.firestore().collection('players').doc(player._id);
  const playerSnapshot: any = await playerRef.get();
  const playerData: any = playerSnapshot.data();
  console.log('Player snapshot data', playerData);
  const newPlayerData = { blackCardsWon: playerData.blackCardsWon + 1 };
  console.log('Updating player', newPlayerData);
  await playerRef.update(newPlayerData);

  // update all players selectedCards to {}
  const playerSnapshots = await admin
    .firestore()
    .collection('players')
    .where('_gameId', '==', player._gameId)
    .get();
  console.log('Removing users selectedCards');
  await Promise.map(playerSnapshots.docs, async doc => {
    const pRef = doc.ref;
    return pRef.update({ selectedCards: {} });
  });

  // TRANSACTION
  await admin.firestore().runTransaction(async t => {
    // get ledger
    const ledgerRef = admin.firestore().collection('/game_ledgers').doc(player._gameId);
    const ledgerSnapshot = await t.get(ledgerRef);
    const ledgerData: any = ledgerSnapshot.data();

    // get next black card from ledger
    const [ledgerIndex, ledData]: any = Object.entries(ledgerData.blackCards).find(
      ([i, card]: any) => card.delt === null
    );
    ledgerData.blackCards[ledgerIndex].delt = true;
    // get that card from collection
    console.log('Getting new black card');
    const blackCardRef = admin.firestore().collection('/black_cards').doc(`${ledData.index}`);
    const blackCardSnapshot = await t.get(blackCardRef);
    const blackCardData = blackCardSnapshot.data();
    console.log('New black card', blackCardData);

    const gRef = admin.firestore().collection('/games').doc(player._gameId);
    const gameSnapshot = await t.get(gRef);
    const gameData: any = gameSnapshot.data();
    // add black card to the game
    // update the current CZAR
    // // need to determin player order and how maintain that (we have the player docs...)
    // // might need to keep a player map on the game object
    console.log('Getting new CZAR');
    const playersMap = Object.keys(gameData.players).sort();
    const currentCzarIndex = playersMap.findIndex(
      playerId => playerId === gameData.currentTurn.czar
    );
    let nextCzar = playersMap[currentCzarIndex + 1];
    if (!nextCzar) {
      nextCzar = playersMap[0];
    }
    console.log('New CZAR', nextCzar);
    const newGameData = {
      'currentTurn.winner': null,
      'currentTurn.czar': nextCzar,
      'currentTurn.blackCard': blackCardData,
      state: 3,
    };
    console.log('New game data', newGameData);
    return t.update(gRef, newGameData);
  });

  await promise;

  return { status: 'ok!' };
});
