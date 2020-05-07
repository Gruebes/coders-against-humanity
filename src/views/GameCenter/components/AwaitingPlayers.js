import React, { useContext } from 'react';
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
import { Games } from 'db';
import { store } from 'store';
import { withRouter } from 'react-router-dom';
import withStyles from '@material-ui/core/styles/withStyles';
import { withSnackbar } from 'notistack';
import Logger from '../../../logger';
import { gameStateTypes } from '../../../enums';

const logger = new Logger({ location: 'AwaitingPlayers' });
function AwaitingPlayers(props) {
  const { classes } = props;
  const { state } = useContext(store);

  const startGame = async () => {
    logger.info(
      { function: 'startGame', stateChange: gameStateTypes.initalizing, game_id: state._gameId },
      'starting new game'
    );
    return Games.doc(state._gameId).update({ state: gameStateTypes.initalizing });
  };

  return (
    <Paper className={classes.paper}>
      {state.otherPlayers && state.otherPlayers.length ? (
        <TableContainer>
          <Table className={classes.table} aria-label="a dense table">
            <TableHead>
              <TableRow>
                <TableCell>Player</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {state.otherPlayers.map(player => (
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
