import React, { useContext } from 'react';
import withStyles from '@material-ui/core/styles/withStyles';
import { Grid, Dialog } from '@material-ui/core';
import { withSnackbar } from 'notistack';
import { GameCard } from 'components';
import { store } from 'store';
import { GameContext } from '../gameContext';
import { gameStateTypes } from 'enums';
import firebase from 'db';

function ChooseBlackModal(props) {
  const { dispatch, state } = useContext(store);
  const { dispatch: gameDispatch, state: gameState } = useContext(GameContext);

  const handleChooseBlack = async player => {
    // show the winner and their screen name
    const currentBlackCard = state.game.currentTurn.blackCard;
    const promise = new Promise(resolve => setTimeout(resolve, 5000));
    // update the user record with the winning card
    const userRef = firebase.firestore().collection('/users').doc(player.user_uid);
    const userData = await userRef.get();
    // update blackCards won
    const cardCount = userData.blackCardsWon[currentBlackCard.index];
    await userRef.update({
      [`blackCardsWon.${currentBlackCard.index}`]: cardCount ? cardCount + 1 : 1,
    });

    // update the player with the black card win
    const playerRef = firebase.firestore().collection('players').doc(player._id);
    const playerData = await playerRef.get();
    await playerRef.update({ blackCardsWon: playerData.blackCardsWon + 1 });

    // update all players selectedCards to {}
    const playerSnapshots = await firebase
      .firestore()
      .collection('players')
      .where('_gameId', '==', player._gameId)
      .get();

    await Promise.map(playerSnapshots.docs, async doc => {
      const playerRef = doc.ref;
      return playerRef.update({ selectedCards: {} });
    });

    // TRANSACTION
    await firebase.firestore().runTransaction(async t => {
      // get ledger
      const ledgerRef = firebase.firestore().collection('/game_ledgers').doc(player._gameId);
      const ledgerSnapshot = await t.get(ledgerRef);
      const ledgerData = ledgerSnapshot.data();

      // get next black card from ledger
      const [ledgerIndex, blackIndex] = Object.entries(ledgerData.blackCards).find(
        ([i, card]) => card.delt === null
      );
      ledgerData.blackCards[ledgerIndex].delt = true;
      // get that card from collection
      const blackCardRef = firebase.firestore().collection('/black_cards').doc(blackIndex);
      const blackCardSnapshot = await t.get(blackCardRef);
      const blackCardData = blackCardSnapshot.data();

      const gameRef = firebase.firestore().collection('/games').doc(player._gameId);
      const gameSnapshot = await t.get(gameRef);
      const gameData = gameSnapshot.data();
      // add black card to the game
      // update the current CZAR
      // // need to determin player order and how maintain that (we have the player docs...)
      // // might need to keep a player map on the game object
      const playersMap = Object.keys(gameData.players).sort();
      const currentCzarIndex = playersMap.findIndex(
        playerId => playerId === gameData.currentTurn.player
      );
      let nextCzar = playersMap[currentCzarIndex + 1];
      if (!nextCzar) {
        nextCzar = playersMap[0];
      }

      await t.update(gameRef, { currentTurn: { player: nextCzar, blackCard: blackCardData } });

      // await promise timeout
      await promise;
      // update state to chooseWhite
      // need this to be the last action in this function so that state change comes last
      return t.update(gameRef, { state: 3 });
    });
  };

  return (
    <>
      {state.game && (
        <Dialog open={state.game.state === gameStateTypes.chooseBlack}>
          {state.otherPlayers && !!state.otherPlayers.length && (
            <>
              {state.otherPlayers.map(player => (
                <GameCard
                  color={'black'}
                  key={player._id}
                  card={gameState.blackCard}
                  onClick={() => handleChooseBlack(player)}
                  children={card => {
                    return Object.entries(player.selectedCards).reduce(
                      (text, [localIndex, nextWhiteCard]) => {
                        if (text.includes('_')) {
                          text = text.replace('_', `<u><em>${nextWhiteCard.text}</em></u>`);
                          text = text.replace('.', '');
                        } else {
                          text = `${text} <u><em>${nextWhiteCard.text}</em></u>`;
                        }
                        return text;
                      },
                      card.text
                    );
                  }}
                />
              ))}
            </>
          )}
        </Dialog>
      )}
    </>
  );
}

const styles = theme => ({
  container: {},
});

export default withStyles(styles)(withSnackbar(ChooseBlackModal));
