import * as functions from 'firebase-functions';
import * as Promise from 'bluebird';
import * as admin from 'firebase-admin';

export const chooseBlack = functions.https.onCall(async (data, context) => {
  const { currentBlackCard, player } = data;
  console.log('data', data);

  const gameRef = admin.firestore().collection('/games').doc(player._gameId);
  await gameRef.update({ 'currentTurn.winner': player.displayName });
  // start a 5 second promise that will resolve at the end, but not before 5 seconds
  const promise = new Promise(resolve => setTimeout(resolve, 5000));
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
    console.log('New ledger index', ledgerIndex);
    console.log('New ledger data', ledData);

    // get that card from collection
    console.log('Getting new black card');
    const blackCardRef = admin.firestore().collection('/black_cards').doc(`${ledData.index}`);
    const blackCardSnapshot = await t.get(blackCardRef);
    const blackCardData = blackCardSnapshot.data();
    console.log('New black card', blackCardData);

    // get new Czar
    const gRef = admin.firestore().collection('/games').doc(player._gameId);
    const gameSnapshot = await t.get(gRef);
    const gameData: any = gameSnapshot.data();

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

    // update ledger
    t.update(ledgerRef, { [`blackCards.${ledgerIndex}.delt`]: true });

    await promise;

    // update game
    const newGameData = {
      'currentTurn.winner': null,
      'currentTurn.czar': nextCzar,
      'currentTurn.blackCard': blackCardData,
      state: 3,
    };
    console.log('New game data', newGameData);
    return t.update(gRef, newGameData);
  });

  // update all players selectedCards to {}
  const playerSnapshots = await admin
    .firestore()
    .collection('players')
    .where('_gameId', '==', player._gameId)
    .get();
  console.log('Removing users selectedCards');
  const playerProms = playerSnapshots.docs.map(async doc => doc.ref.update({ selectedCards: {} }));
  await Promise.all(playerProms);

  return { status: 'ok!' };
});
