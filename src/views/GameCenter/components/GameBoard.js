import React from 'react';
import { withRouter } from 'react-router-dom';
import withStyles from '@material-ui/core/styles/withStyles';
import { Grid } from '@material-ui/core';
import { withSnackbar } from 'notistack';
import GameDetails from './GameDetails';
import PlayerCards from './PlayerCards';
import { GameStateProvider } from '../gameContext';

function GameBoard(props) {
  return (
    <GameStateProvider>
      <Grid container classes={{ root: props.classes.container }} spacing={2}>
        <Grid item xs={12}>
          <GameDetails />
          <PlayerCards />
        </Grid>
      </Grid>
    </GameStateProvider>
  );
}

const styles = theme => ({
  container: {
    // position: 'absolute',
    // width: '100%',
    // maxWidth: '120rem',
    // bottom: '2rem',
    // left: '5rem',
    marginTop: '2.5rem',
  },
});

export default withRouter(withStyles(styles)(withSnackbar(GameBoard)));
