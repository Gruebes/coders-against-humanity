import React, { useContext, useEffect } from 'react';
import withStyles from '@material-ui/core/styles/withStyles';
import firebase, { Games, Players } from 'db';
import { withRouter } from 'react-router-dom';
import { AuthContext } from '../../Auth';
import { store } from 'store';
import { gameStateTypes } from 'enums';
import { getPlayerObject } from '../../utils';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@material-ui/core';
import { withSnackbar } from 'notistack';
import { logger } from 'logger';

const log = logger.child({ component: 'JoinGame' });
function JoinGame(props) {
  const { classes } = props;
  const { currentUser } = useContext(AuthContext);
  const { dispatch, state } = useContext(store);
  // listen for open Games
  useEffect(() => {
    return Games.where('state', '==', gameStateTypes.open).onSnapshot(
      querySnapshot => {
        const docs = querySnapshot.docs
          .map(doc => ({ ...doc.data(), _id: doc.id }))
          .filter(g => g.totalPlayers < g.playerLimit);
        dispatch({ type: 'SET_OPEN_GAMES', data: docs });
      },
      err => {
        log.error(err, err.message);
        return props.enqueueSnackbar(err.message, {
          variant: 'error',
        });
      }
    );
  }, [dispatch, props]);

  const handleJoinGame = async game => {
    dispatch({ type: 'SET_AWAITING_GAME', data: true });
    try {
      await updatePlayerCount(game);
    } catch (err) {
      log.error(err, err.message);
      return props.enqueueSnackbar(err.message, {
        variant: 'error',
      });
    }
    // set game and player
    try {
      const playerRef = await Players.add(getPlayerObject(currentUser, game._id));
      const playerData = { ...(await playerRef.get()).data(), _id: playerRef.id };
      dispatch({ type: 'SET_GAME', data: game });
      dispatch({ type: 'SET_GAME_ID', data: game._id });
      dispatch({ type: 'SET_PLAYER', data: playerData });
      dispatch({ type: 'SET_PLAYER_ID', data: playerData._id });
      props.moveToGameCenter(game._id, playerData._id);
    } catch (err) {
      log.error(err, err.message);
      return props.enqueueSnackbar(err.message, {
        variant: 'error',
      });
    }
  };

  const updatePlayerCount = async game => {
    const gameRef = await Games.doc(game._id);
    return firebase.firestore().runTransaction(transaction => {
      return transaction.get(gameRef).then(game => {
        const newPlayerCount = game.data().totalPlayers + 1;
        if (newPlayerCount > game.data().playerLimit) {
          throw new Error('Opps! Too many players in this game, try another');
        }
        transaction.update(gameRef, { totalPlayers: newPlayerCount });
      });
    });
  };

  return (
    <Paper className={classes.paper}>
      <TableContainer>
        <Table className={classes.table} aria-label="a dense table">
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Host</TableCell>
              <TableCell>Spots Left</TableCell>
              <TableCell>Capacity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {state.openGames.map(game => (
              <TableRow key={game._id}>
                <TableCell component="th" scope="row">
                  <Button onClick={() => handleJoinGame(game)} variant="text">
                    Join
                  </Button>
                </TableCell>
                <TableCell component="th" scope="row">
                  {game.host_user.displayName}
                </TableCell>
                <TableCell component="th" scope="row">
                  {game.playerLimit - game.totalPlayers}
                </TableCell>
                <TableCell component="th" scope="row">
                  {game.playerLimit}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
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

export default withRouter(withStyles(styles)(withSnackbar(JoinGame)));
