import React, { useContext, useEffect } from 'react';
import withStyles from '@material-ui/core/styles/withStyles';
import { withRouter } from 'react-router-dom';
import { store } from '../../store';
import { Games } from '../../firebase';
import { gameStateTypes } from '../../enums';
import { withSnackbar } from 'notistack';
import { logger } from '../../logger';

import CreateGame from './components/CreateGame';
import JoinGame from './components/JoinGame';

const log = logger.child({ component: 'Dashboard' });
function Dashboard(props) {
  const { classes } = props;
  const { dispatch } = useContext(store);

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
        log.error(err, 'Error listening to game.state === open');
        props.enqueueSnackbar('Error listening to gameState');
      }
    );
  }, [dispatch]);

  const moveToGameCenter = (_gameId, _playerId) => {
    if (_gameId && _playerId) {
      props.history.push({
        pathname: '/game-center',
        search: `?gid=${_gameId}&pid=${_playerId}`,
        state: { _gameId, _playerId },
      });
    } else {
      props.enqueueSnackbar('Error moving to game-center');
    }
  };

  return (
    <main className={classes.main}>
      <JoinGame moveToGameCenter={moveToGameCenter} />
      <CreateGame moveToGameCenter={moveToGameCenter} />
    </main>
  );
}

const styles = theme => ({
  main: {
    width: 'auto',
    display: 'block', // Fix IE 11 issue.
    marginLeft: theme.spacing(3),
    marginRight: theme.spacing(3),
    [theme.breakpoints.up(400 + theme.spacing(3) * 2)]: {
      width: 400,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
});

export default withRouter(withStyles(styles)(withSnackbar(Dashboard)));
