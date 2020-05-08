import React, { useContext } from 'react';
import Promise from 'bluebird';
import { Players } from 'db';
import withStyles from '@material-ui/core/styles/withStyles';
import { withSnackbar } from 'notistack';
import { Box, Button } from '@material-ui/core';
import Slide from '@material-ui/core/Slide';
import { GameContext } from '../gameContext.js';
import { store } from 'store';
import { logger } from 'logger';

const log = logger.child({ component: 'SubmitCards' });
function SubmitCards(props) {
  const { classes } = props;
  const { state } = useContext(store);
  const { dispatch: gameDispatch, state: gameState } = useContext(GameContext);

  const handleSubmitCards = async () => {
    try {
      const playerRef = Players.doc(state._playerId);
      // const player = await playerRef.get();
      await playerRef.update({ selectedCards: gameState.selectedCards });
      log.info({}, 'Submitting cards');
      gameDispatch({ type: 'SET_SELECTED_CARDS', data: {} });
    } catch (err) {
      log.error(err, 'error submitting cards');
      props.enqueueSnackbar(err.message, {
        variant: 'error',
      });
    }
  };

  return (
    <Slide
      className={classes.slider}
      direction={'up'}
      in={gameState.showSubmit}
      mountOnEnter
      unmountOnExit
    >
      <Box alignContent="center">
        <Button
          classes={{ root: classes.button }}
          color={'default'}
          variant={'cointained'}
          onClick={handleSubmitCards}
        >
          submit
        </Button>
      </Box>
    </Slide>
  );
}

const styles = theme => ({
  // slider: {
  //   bottom: '3rem',
  //   width: '100%',
  //   position: 'absolute',
  //   left: 'calc(50vw - 15.5rem)',
  // },
  button: {
    fontSize: '2rem',
    color: 'white',
    backgroundColor: theme.palette.secondary.main,
    '&:hover': {
      backgroundColor: theme.palette.secondary.dark,
    },
    width: '25%',
  },
});

export default withStyles(styles)(withSnackbar(SubmitCards));
