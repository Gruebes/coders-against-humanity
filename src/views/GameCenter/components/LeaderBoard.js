import React, { useContext, useEffect } from 'react';
import { Avatar, Chip, Grid, Paper, Typography } from '@material-ui/core';
import { store } from '../../../store';
import { GameContext } from '../gameContext.js';
import { withRouter } from 'react-router-dom';
import withStyles from '@material-ui/core/styles/withStyles';
import { withSnackbar } from 'notistack';
import { logger } from '../../../logger';

const log = logger.child({ component: 'LeaderBoard' });
function LeaderBoard(props) {
  const { classes } = props;
  const { dispatch: gameDispatch, state: gameState } = useContext(GameContext);
  const { state } = useContext(store);

  useEffect(() => {
    if (state.game && state.player && state.otherPlayers) {
      const allPlayers = [state.player, ...state.otherPlayers];
      const currentCzar = allPlayers.find(player => player._id === state.game.currentTurn.czar);

      gameDispatch({ type: 'SET_ALL_PLAYERS', data: allPlayers });
      gameDispatch({ type: 'SET_CURRENT_CZAR', data: currentCzar });
    }
  }, [state.game && state.game.currentTurn, state.player, state.otherPlayers]);

  return (
    <div>
      {gameState.allPlayers && gameState.currentCzar && (
        <Paper classes={{ root: classes.container }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item={12}>Current Turn: {gameState.currentCzar.displayName}</Grid>
              </Grid>
              <Grid container spacing={2}>
                {gameState.allPlayers.map(player => (
                  <Grid item xs={6} key={player._id}>
                    <Chip
                      classes={{ root: classes.chips, label: classes.labelContainer }}
                      avatar={<Avatar>{player.displayName[0].toUpperCase()}</Avatar>}
                      label={
                        <>
                          <Typography>{player.displayName}</Typography>
                          <Typography>Won: {player.blackCardsWon}</Typography>
                        </>
                      }
                      // clickable
                      color={Object.keys(player.selectedCards).length ? 'secondary' : 'default'}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      )}
    </div>
  );
}

const styles = theme => ({
  container: {
    padding: '0 1rem',
  },
  chips: {
    width: '-webkit-fill-available',
  },
  labelContainer: {
    display: 'flex',
    flexFlow: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
});

export default withRouter(withStyles(styles)(withSnackbar(LeaderBoard)));
