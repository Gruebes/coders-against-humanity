import React, { useContext, useEffect } from 'react';
import withStyles from '@material-ui/core/styles/withStyles';
import { CircularProgress, Container } from '@material-ui/core';
import firebase, { BlackCards, Games, GameDecks, Players, WhiteCards } from '../../firebase';
import { withRouter } from 'react-router-dom';
import { store } from '../../store';
import { gameStateTypes } from '../../enums';
import AwaitingPlayers from './components/AwaitingPlayers';
import GameBoard from './components/GameBoard';
import { getDocsWithId } from '../utils';
import { withSnackbar } from 'notistack';
import Logger from '../../logger';
import Promise from 'bluebird';

const logger = new Logger({ location: 'GameCenter' });
function GameCenter(props) {
  const { classes } = props;
  const { dispatch, state } = useContext(store);

  // get player and game if missing (Rejoin)
  useEffect(() => {
    const getGameAndPlayer = async () => {
      try {
        const { _gameId, _playerId } = props.location.state;
        if (!_gameId || !_playerId) {
          debugger;
          throw new Error('No game or player ids on history.locaation.state');
        }

        const game = (await Games.doc(_gameId).get()).data();
        dispatch({ type: 'SET_GAME', data: game });
        dispatch({ type: 'SET_GAME_ID', data: _gameId });

        const player = (await Players.doc(_playerId).get()).data();
        dispatch({ type: 'SET_PLAYER', data: player });
        dispatch({ type: 'SET_PLAYER_ID', data: _playerId });
      } catch (err) {
        debugger;
        logger.error(err, 'Could not set Current Player');
        props.enqueueSnackbar('Could not set Current Player', {
          variant: 'error',
        });
      }
    };
    if (!state._gameId || !state._playerId) {
      getGameAndPlayer();
    }
  }, []);

  // listen for game changes -- remove cloud actions after cloud function exitsts
  useEffect(() => {
    if (state._gameId) {
      return Games.doc(state._gameId).onSnapshot(
        async querySnapshot => {
          const game = querySnapshot.data();
          dispatch({ type: 'SET_GAME', data: { ...game, _id: querySnapshot.id } });

          /**
           * cloud actions below
           */
          if (game.state === gameStateTypes.initalizing) {
            await dealCards();
          }
        },
        err => {
          logger.error(err, 'Error listening for players');
          props.enqueueSnackbar('Error listening for players', {
            variant: 'error',
          });
        }
      );
    }
  }, [state._gameId]);

  // listen for player changes
  useEffect(() => {
    if (state.player && state._playerId && state.game && state._gameId) {
      return Players.where('_gameId', '==', state._gameId).onSnapshot(
        querySnapshot => {
          const allPlayers = getDocsWithId(querySnapshot.docs);
          const currentPlayer = allPlayers.find(p => p._id === state._playerId);
          const otherPlayers = allPlayers.filter(p => p._id !== state._playerId);
          // TODO's
          //  check for player card changes and set them (blacks won, currnt turn, card czar, etc)
          if (otherPlayers && otherPlayers.length) {
            dispatch({ type: 'SET_OTHER_PLAYERS', data: otherPlayers });
          }
          // check for current player changes and update those. (cards, blacks won, currnt turn, card czar, etc)
          if (currentPlayer) {
            dispatch({ type: 'SET_PLAYER', data: currentPlayer });
          }

          /**
           * cloud actions below
           */
        },
        err => {
          logger.error(err, 'Error listening for players');
          props.enqueueSnackbar('Error listening for players', {
            variant: 'error',
          });
        }
      );
    }
  }, [state._gameId, state._playerId]);

  /**
   * CLOUD HELPER FUNCTIONS
   */
  const dealCards = async () => {
    const config = (await firebase.firestore().collection('/config').get()).docs.map(doc => ({
      ...doc.data(),
      _id: doc.id,
    }))[0];

    const shuffledBlack = fisherYatesShuffle(getCardIndexes(config.blackCount));
    const shuffledWhite = fisherYatesShuffle(getCardIndexes(config.whiteCount));
    // create game deck
    const gameDeck = getGameDeck(shuffledBlack, shuffledWhite);
    // set players white cards
    await createPlayersWhiteCardsMap(gameDeck, shuffledWhite);

    const blackIndex = shuffledBlack[0];
    const blackCard = (await BlackCards.doc(`${blackIndex}`).get()).data();
    // mark this card on game deck
    gameDeck.blackCards[blackIndex] = true;
    // update black card on game
    await Games.doc(state._gameId).update({
      'currentTurn.blackCard': blackCard,
      state: gameStateTypes.ready,
    });
    // set game deck
    return GameDecks.doc(state._gameId).set(gameDeck);
  };

  const createPlayersWhiteCardsMap = async (gameDeck, shuffledWhite) => {
    const players = await Players.where('_gameId', '==', state._gameId).get();
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

  // TODO:
  // if game is open, show awaiting players
  // if game is initalizing => show loader
  // if game is anything else => show game board for now
  return (
    <Container>
      {state.game && state.game.state === gameStateTypes.open ? (
        <AwaitingPlayers />
      ) : !state.game || state.game.state === gameStateTypes.initalizing ? (
        <div>
          <CircularProgress />
        </div>
      ) : (
        <GameBoard />
      )}
    </Container>
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

// const shuffle = deck => {
//   let m = deck.length,
//     i;
//   while (m) {
//     i = Math.floor(Math.random() * m--);

//     [deck[m], deck[i]] = [deck[i], deck[m]];
//   }
//   return deck;
// };

const fisherYatesShuffle = deck => {
  let theLength = deck.length - 1;
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
