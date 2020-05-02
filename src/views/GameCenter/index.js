import React, { useContext, useEffect } from 'react';
import withStyles from '@material-ui/core/styles/withStyles';
import { CircularProgress } from '@material-ui/core';
import firebase, { BlackCards, Games, GameDecks, Players, WhiteCards } from '../../firebase';
import { withRouter } from 'react-router-dom';
import { store } from '../../store';
import { gameStateTypes } from '../../enums';
import AwaitingPlayers from './components/AwaitingPlayers';
import GameBoard from './components/GameBoard';
import { getDocsWithId, riffleShuffle } from '../utils';
import { withSnackbar } from 'notistack';
import logger from '../../logger';
import Promise from 'bluebird';

function GameCenter(props) {
  const { classes } = props;
  const { dispatch, state } = useContext(store);

  // listen for game changes HYBRID -- delete after cloud function exitsts
  useEffect(() => {
    if (state.game && state.game._id) {
      return Games.doc(state.game._id).onSnapshot(
        querySnapshot => {
          const game = querySnapshot.data();
          dispatch({ type: 'SET_GAME', data: { ...game, _id: querySnapshot.id } });
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
  }, [state.game._id, state.player._id]);

  /**
   * CLOUD FUNCTIONS
   */
  // listen for game STATE changes

  // // listen for game changes
  // useEffect(() => {
  //   if (state.game && state.game._id && state.player && state.player.isHost) {
  //     return Games.doc(state.game._id).onSnapshot(
  //       querySnapshot => {
  //         const game = querySnapshot.data();
  //         if (game.state === gameStateTypes.initalizing) {
  //           dealCards();
  //         }
  //       },
  //       err => {
  //         log.error(err, 'Error listening for players');
  //       }
  //     );
  //   }
  // }, [state.game, state.player]);

  const dealCards = async () => {
    const config = (await firebase.firestore().collection('/config').get()).docs.map(doc => ({
      ...doc.data(),
      _id: doc.id,
    }))[0];
    // shuffle
    // TODO: find new shuffle
    // Also, dont need to set the shuffled indexes on the gamDeck ledger
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
    const batch = firebase.firestore().batch();

    await Promise.each(players.docs, async player => {
      // get 10 cards from deck
      const cards = shuffledWhite.splice(0, 10);
      // TODO: get all card docs from db and place on player doc
      const cardsSnapShot = await firebase
        .firestore()
        .collection('/white_cards')
        .where('index', 'in', cards)
        .get();

      const playersCards = {};
      cardsSnapShot.docs.forEach((card, index) => {
        const cardData = card.data();
        // set players starting cards
        playersCards[index] = cardData;
        // mark the card on the game_deck ledger (modifies in place)
        gameDeck.whiteCards[cardData.index] = player.id;
      });

      const playerRef = Players.doc(player.id);
      return batch.update(playerRef, { whiteCards: playersCards });
      // Commit the batch
    });

    return batch.commit();
  };
  /**
   * end of CLOUD FUNCTIONS
   */
  ////////////////////////////////////////////////////////////////////////////////
  /**
   * Game Center Below
   */

  // listen for game changes -- TODO: use after cloud function exists
  // useEffect(() => {
  //   if (state.game && state.game._id && state.player && state.player.isHost) {
  //     return Games.doc(state.game._id).onSnapshot(
  //       querySnapshot => {
  //         // get player data
  //         const game = querySnapshot.data();
  //         dispatch({ type: 'SET_GAME', data: game });
  //       },
  //       err => {
  //         logger.error(err, 'Error listening for players');
  //         props.enqueueSnackbar('Error listening for players');
  //       }
  //     );
  //   }
  // }, [state.game, state.player]);

  // listen for player changes
  useEffect(() => {
    if (state.player && state.player._id && state.game && state.game._id) {
      return Players.where('_gameId', '==', state.game._id).onSnapshot(
        querySnapshot => {
          const allPlayers = getDocsWithId(querySnapshot.docs);
          const currentPlayer = allPlayers.find(p => p._id === state.player._id);
          const otherPlayers = allPlayers.filter(p => p._id !== state.player._id);
          // TODO's
          //  check for player card changes and set them (blacks won, currnt turn, card czar, etc)
          if (otherPlayers && otherPlayers.length) {
            dispatch({ type: 'SET_OTHER_PLAYERS', data: otherPlayers });
          }
          // check for current player changes and update those. (cards, blacks won, currnt turn, card czar, etc)
          if (currentPlayer) {
            dispatch({ type: 'SET_PLAYER', data: currentPlayer });
          }
        },
        err => {
          logger.error(err, 'Error listening for players');
          props.enqueueSnackbar('Error listening for players');
        }
      );
    }
  }, [state.game._id, state.player._id]);

  // TODO:
  // if game is open, show awaiting players
  // if game is initalizing => show loader
  // if game is anything else => show game board for now
  return (
    <main className={classes.main}>
      {state.game && state.game.state === gameStateTypes.open ? (
        <AwaitingPlayers />
      ) : !state.game || state.game.state === gameStateTypes.initalizing ? (
        <div>
          <CircularProgress />
        </div>
      ) : (
        <GameBoard />
      )}
    </main>
  );
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
