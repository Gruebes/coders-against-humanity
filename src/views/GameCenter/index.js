import React, { useContext, useEffect } from 'react';
import withStyles from '@material-ui/core/styles/withStyles';
import { CircularProgress, Container } from '@material-ui/core';
import firebase, { Games, Players } from '../../firebase';
import { withRouter } from 'react-router-dom';
import { store } from '../../store';
import { gameStateTypes } from '../../enums';
import AwaitingPlayers from './components/AwaitingPlayers';
import GameBoard from './components/GameBoard';
import { getDocsWithId } from '../utils';
import { withSnackbar } from 'notistack';
import { logger } from '../../logger';

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
          // if (game.state === gameStateTypes.chooseBlack) {
          //   dispatch({ type: 'SHOW_CHOOSE_BLACK', data: true });
          // }
          /**
           * cloud actions below
           */
          // TODO: Move this to be called directly??
          if (game.state === gameStateTypes.initalizing && state.player && state.player.isHost) {
            debugger;
            const dealCards = firebase.functions().httpsCallable('dealCards');
            const result = await dealCards({ _gameId: state._gameId });
            log.info(result, 'deal cards result');
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
