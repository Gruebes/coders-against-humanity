import React, { useContext, useEffect } from 'react';
import {
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@material-ui/core';
import firebase, { Games, Players } from '../../../firebase';
import { store } from '../../../store';
import { withRouter } from 'react-router-dom';
import withStyles from '@material-ui/core/styles/withStyles';
import { withSnackbar } from 'notistack';
import Logger from '../../../logger';
import { gameStateTypes } from '../../../enums';

const logger = new Logger({ location: 'AwaitingPlayers' });
function AwaitingPlayers(props) {
  const { classes } = props;
  const { dispatch, state } = useContext(store);

  // get player and game
  // useEffect(() => {
  //   const getGameAndPlayer = async () => {
  //     try {
  //       const game = (await Games.doc(state.game._id).get()).data();
  //       dispatch({ type: 'SET_GAME', data: game });
  //       const player = (await Players.doc(state._playerId).get()).data();
  //       dispatch({ type: 'SET_PLAYER', data: player });
  //     } catch (err) {
  //       logger.error(err, 'Could not set Current Player');
  //       props.enqueueSnackbar('Could not set Current Player');
  //     }
  //   };
  //   getGameAndPlayer();
  // }, []);

  // listen for players joining
  useEffect(() => {
    if (state.game._id) {
      return Players.where('_gameId', '==', state.game._id).onSnapshot(
        querySnapshot => {
          // get player data
          const docs = querySnapshot.docs
            .map(doc => ({ ...doc.data(), _id: doc.id }))
            // remove self from players list ??
            .filter(p => p.id !== state._playerId);
          // set players
          dispatch({ type: 'SET_PLAYERS_AWAITING', data: docs });
        },
        err => {
          logger.error(err, 'Error listening for players');
          props.enqueueSnackbar('Error listening for players');
        }
      );
    }
  }, [dispatch, state.game._id]);

  const startGame = async () => {
    // TODO: Show cards move to select White
    return Games.doc(state.game._id).update({ state: gameStateTypes.ready });
  };

  return (
    <Paper className={classes.paper}>
      {state.playersAwaiting.length ? (
        <TableContainer>
          <Table className={classes.table} aria-label="a dense table">
            <TableHead>
              <TableRow>
                <TableCell>Player</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {state.playersAwaiting.map(player => (
                <TableRow key={player._id}>
                  <TableCell component="th" scope="row">
                    {player.displayName}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <CircularProgress />
      )}
      <Button color="primary" onClick={startGame} variant="contained">
        Start Game Now
      </Button>
    </Paper>
  );
}

const styles = theme => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: `${theme.spacing(2)}px ${theme.spacing(3)}px ${theme.spacing(3)}px`,
  },
});

export default withRouter(withStyles(styles)(withSnackbar(AwaitingPlayers)));
