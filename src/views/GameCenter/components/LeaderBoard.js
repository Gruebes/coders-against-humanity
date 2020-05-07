import React, { useContext } from 'react';
import { Grid, Paper, Typography } from '@material-ui/core';
import { store } from 'store';
import { GameContext } from '../gameContext.js';
import { withRouter } from 'react-router-dom';
import withStyles from '@material-ui/core/styles/withStyles';
import { withSnackbar } from 'notistack';
import { logger } from 'logger';

const log = logger.child({ component: 'LeaderBoard' });
function LeaderBoard(props) {
  const { state: gameState } = useContext(GameContext);
  const { state } = useContext(store);

  return (
    <div>
      {gameState.blackCard && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Paper>
              <Typography align={'left'}>hello</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
    </div>
  );
}

const styles = theme => ({});

export default withRouter(withStyles(styles)(withSnackbar(LeaderBoard)));
