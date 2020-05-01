import React, { useContext, useEffect } from 'react';
import withStyles from '@material-ui/core/styles/withStyles';
import firebase, { BlackCards, Games, GameDecks, Players, WhiteCards } from '../../firebase';
import { withRouter } from 'react-router-dom';
import { store } from '../../store';
import { gameStateTypes } from '../../enums';
import AwaitingPlayers from './components/AwaitingPlayers';
import { riffleShuffle } from '../utils';
import { withSnackbar } from 'notistack';
import logger from '../../logger';
import Promise from 'bluebird';

function GameCenter(props) {
  const { classes } = props;
  const { state } = useContext(store);

  // listen for game changes
  useEffect(() => {
    if (state.game && state.game._id && state.player && state.player.isHost) {
      return Games.doc(state.game._id).onSnapshot(
        querySnapshot => {
          // get player data
          const game = querySnapshot.data();
          if (game.state === gameStateTypes.initalizing) {
            dealCards();
          }
        },
        err => {
          logger.error(err, 'Error listening for players');
          props.enqueueSnackbar('Error listening for players');
        }
      );
    }
  }, [state.game, state.player]);

  const dealCards = async () => {
    const config = (await firebase.firestore().collection('/config').get()).docs.map(doc => ({
      ...doc.data(),
      _id: doc.id,
    }))[0];
    // shuffle
    // TODO: find new shuffle
    const shuffledBlack = riffleShuffle(getCardIndexes(config.blackCount), 4);
    const shuffledWhite = riffleShuffle(getCardIndexes(config.whiteCount), 5);
    // create game deck
    const gameDeck = getGameDeck(shuffledBlack, shuffledWhite);
    // set players white cards
    await createPlayersWhiteCardsMap(gameDeck, shuffledWhite);
    // update black card on game
    await Games.doc(state.game._id).update({
      'currentTurn.blackCard': shuffledBlack[0],
      // [`players.${state.player._id}`]: true,
      state: gameStateTypes.ready,
    });
    // set game deck
    return GameDecks.doc(state.game._id).set(gameDeck);
  };

  const createPlayersWhiteCardsMap = async (gameDeck, shuffledWhite) => {
    const players = await Players.where('_gameId', '==', state.game._id).get();
    return Promise.each(players.docs, async player => {
      // TODO: this does not need to be a batch anymore
      const batch = firebase.firestore().batch();
      const playersCards = {};
      // get 10 cards from deck
      const cards = shuffledWhite.splice(0, 10);
      cards.forEach((card, index) => {
        // set players starting cards
        playersCards[index] = card;
        // mark the card on the game_deck ledger
        gameDeck.whiteCards[card] = player.id;
      });
      const playerRef = await Players.doc(player.id);
      batch.update(playerRef, { whiteCards: cards });
      // Commit the batch
      return batch.commit();
    });
  };

  return <main className={classes.main}>{state.awaitingGame ? <AwaitingPlayers /> : <div>Game Board</div>}</main>;
}

const styles = theme => ({});

export default withRouter(withStyles(styles)(withSnackbar(GameCenter)));

const getGameDeck = (blackCards, whiteCards) => {
  return {
    blackCards: blackCards.reduce((acc, c) => {
      acc[c] = null;
      return acc;
    }, {}),
    whiteCards: whiteCards.reduce((acc, c) => {
      acc[c] = null;
      return acc;
    }, {}),
  };
};

const getCardIndexes = count => {
  const indexArray = [];
  for (let i = 0; i <= count; i++) {
    indexArray.push(i);
  }
  return indexArray;
};
