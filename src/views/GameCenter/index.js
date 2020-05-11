import React, { useContext, useEffect } from 'react';
import withStyles from '@material-ui/core/styles/withStyles';
import { CircularProgress, Container } from '@material-ui/core';
import firebase, { BlackCards, Games, GameLedgers, Players } from 'db';
import { withRouter } from 'react-router-dom';
import { store } from 'store';
import { gameStateTypes } from 'enums';
import AwaitingPlayers from './components/AwaitingPlayers';
import GameBoard from './components/GameBoard';
import { getDocsWithId } from '../utils';
import { withSnackbar } from 'notistack';
import { logger } from 'logger';
import Promise from 'bluebird';

const log = logger.child({ component: 'GameCenter' });
function GameCenter(props) {
  const { dispatch, state } = useContext(store);

  // get player and game if missing (Rejoin)
  useEffect(() => {
    const getGameAndPlayer = async () => {
      try {
        const regex = /\?gid=(.*)&pid=(.*)/gm;

        const [, _gameId, _playerId] = regex.exec(props.location.search);
        if (!_gameId || !_playerId) {
          throw new Error('No game or player ids on history.locaation.state');
        }

        const game = (await Games.doc(_gameId).get()).data();
        dispatch({ type: 'SET_GAME', data: game });
        dispatch({ type: 'SET_GAME_ID', data: _gameId });

        const player = (await Players.doc(_playerId).get()).data();
        dispatch({ type: 'SET_PLAYER', data: player });
        dispatch({ type: 'SET_PLAYER_ID', data: _playerId });
        log.info(
          { function: 'getGameAndPlayer', _gameId, _playerId },
          'reloading game from url params'
        );
      } catch (err) {
        log.error(err, 'Could not set Current Player');
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
          if (game.state === gameStateTypes.chooseBlack) {
            dispatch({ type: 'SHOW_CHOOSE_BLACK', data: true });
          }

          /**
           * cloud actions below
           */
          if (game.state === gameStateTypes.initalizing) {
            await dealCards();
          }
        },
        err => {
          log.error(err, 'Error listening for players');
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
        async querySnapshot => {
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

          if (!querySnapshot.size || !state.player.isHost) return;

          const players = querySnapshot.docs.map(doc => ({ ...doc.data(), _id: doc.id }));
          const gameId = players[0]._gameId;
          const allPlayersSubmitted = players.every(p => Object.keys(p.selectedCards).length);
          const gameRef = firebase.firestore().collection('/games').doc(gameId);
          const gameData = (await gameRef.get()).data();

          // check to see if allPlayers have cards submitted
          if (gameData.state === gameStateTypes.chooseWhite && allPlayersSubmitted) {
            // if so, set the game state to selectBlack
            await gameRef.update({ state: gameStateTypes.chooseBlack });
          }
          // handle trading cards with cloud dealer
          const docChanges = querySnapshot.docChanges();

          await Promise.each(docChanges, async playerChange => {
            const playerData = playerChange.doc.data();
            const selectedEntries = Object.entries(playerData.selectedCards);
            const whiteEntriesToRepl = Object.entries(
              playerData.whiteCards
            ).filter(([index, card]) => selectedEntries.find(([i, c]) => c.index === card.index));

            // if we have no cards to replace, return
            if (!selectedEntries.length || !whiteEntriesToRepl.length) return;

            // transaction for switching cards between ledger and player
            return firebase.firestore().runTransaction(async t => {
              const ledgerRef = firebase.firestore().collection('/game_ledgers').doc(gameId);
              const ledgerSnapshot = await t.get(ledgerRef);
              const ledgerData = ledgerSnapshot.data();

              // get the first avaiable white cards from ledger according to whiteEntriesToRepl.length
              const useCards = Object.entries(ledgerData.whiteCards)
                .filter(([cardIndex, val]) => val.delt_to === null)
                .slice(0, whiteEntriesToRepl.length);
              // mark the new cards on the ledger
              useCards.forEach(([cardIndex, val]) => {
                ledgerData.whiteCards[cardIndex].delt_to = playerChange.doc.id;
              });

              // t.get those cards
              const newCards = await Promise.map(useCards, async ([index, data]) => {
                const cardIndex = data.index;
                const cardRef = firebase.firestore().collection('/white_cards').doc(`${cardIndex}`);
                const cardData = (await t.get(cardRef)).data();
                return cardData;
              });

              // replace those on the players deck
              whiteEntriesToRepl.forEach(([whiteIdx, whiteEnt], index) => {
                playerData.whiteCards[whiteIdx] = newCards[index];
              });

              // update that on the players doc
              const playerRef = playerChange.doc.ref;
              await t.update(playerRef, { whiteCards: playerData.whiteCards });
              // update ledger
              return await t.update(ledgerRef, { whiteCards: ledgerData.whiteCards });
            });
          });
        },
        err => {
          log.error(err, 'Error listening for players');
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
    const gameLedger = getGameDeck(shuffledBlack, shuffledWhite);
    // set players white cards
    await createPlayersWhiteCardsMap(gameLedger);

    // TODO: getting the same black card each time
    const blackIndex = shuffledBlack[0];
    const blackCard = (await BlackCards.doc(`${blackIndex}`).get()).data();
    // mark this card on game deck
    gameLedger.blackCards[0].delt = true;

    // TRANSACTION?
    // set game ledger
    await GameLedgers.doc(state._gameId).set(gameLedger);
    // update black card on game
    return Games.doc(state._gameId).update({
      'currentTurn.blackCard': blackCard,
      state: gameStateTypes.chooseWhite,
    });
  };

  const createPlayersWhiteCardsMap = async ledgerData => {
    const players = await Players.where('_gameId', '==', state._gameId).get();
    const batch = firebase.firestore().batch();

    // build up player decks
    await Promise.each(players.docs, async player => {
      // get 10 cards from deck
      const useCards = Object.entries(ledgerData.whiteCards)
        .filter(([cardIndex, val]) => val.delt_to === null)
        .slice(0, 10);
      // card indexes for query
      const cardIdxs = useCards.map(c => c[1].index);

      useCards.forEach(([cardIndex, val]) => {
        // mark the card on the game_deck ledger (modifies in place)
        ledgerData.whiteCards[cardIndex].delt_to = player.id;
      });
      const cardsSnapShot = await firebase
        .firestore()
        .collection('/white_cards')
        .where('index', 'in', cardIdxs)
        .get();

      const playersCards = {};
      cardsSnapShot.docs.forEach((card, index) => {
        const cardData = card.data();
        // set players starting cards
        playersCards[index] = cardData;
      });

      const playerRef = Players.doc(player.id);
      return batch.update(playerRef, { whiteCards: playersCards });
    });

    // Commit the batch
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
    blackCards: blackCards.reduce((acc, index, idx) => {
      acc[idx] = { index, delt: null };
      return acc;
    }, {}),
    whiteCards: whiteCards.reduce((acc, index, idx) => {
      acc[idx] = { index, delt_to: null };
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
