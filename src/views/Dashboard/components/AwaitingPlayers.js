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
import { Games, Players } from '../../../firebase';
import { store } from '../../../store';
import { withRouter } from 'react-router-dom';
import withStyles from '@material-ui/core/styles/withStyles';

function AwaitingPlayers(props) {
  const { classes } = props;
  const { dispatch, state } = useContext(store);

  // listen for players joining
  useEffect(() => {
    if (state.game_id) {
      return Players.where('game_id', '==', state.game_id).onSnapshot(
        querySnapshot => {
          const docs = querySnapshot.docs.map(doc => ({ ...doc.data(), _id: doc.id }));
          dispatch({ type: 'SET_PLAYERS_AWAITING', data: docs });
        },
        err => {
          console.log(`Encountered error: ${err}`);
        }
      );
    }
  }, [dispatch, state.game_id]);

  const handleForceStart = async game => {};

  return (
    <Paper className={classes.paper}>
      {/* {state.playersAwaiting ? ( */}
      {!state.playersAwaiting.lengh ? (
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
      <Button color="primary" onClick={() => handleForceStart()} variant="contained">
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

export default withRouter(withStyles(styles)(AwaitingPlayers));
