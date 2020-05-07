import React, { useContext } from 'react';
import { Players } from 'db';
import withStyles from '@material-ui/core/styles/withStyles';
import { withSnackbar } from 'notistack';
import { Button } from '@material-ui/core';
import Slide from '@material-ui/core/Slide';
import { GameContext } from '../gameContext.js';
import { store } from 'store';
import Logger from '../../../logger';

const logger = new Logger({ location: 'SubmitCards' });
function SubmitCards(props) {
  const { classes } = props;
  const { state } = useContext(store);
  const { dispatch: gameDispatch, state: gameState } = useContext(GameContext);

  const handleSubmitCards = async () => {
    try {
      const player = await Players.doc(state._gameId).get();
      await player.update({ selectedCards: gameState.selectedCards });
      logger.info({}, 'Submitting cards');
      gameDispatch({ type: 'SET_SELECTED_CARDS', data: {} });
    } catch (err) {
      logger.error(err, 'error submitting cards');
      props.enqueueSnackbar(err.message, {
        variant: 'error',
      });
    }
  };

  return (
    <Slide
      className={classes.buttonContainer}
      direction={'up'}
      in={gameState.showSubmit}
      mountOnEnter
      unmountOnExit
    >
      <Button
        classes={{ root: classes.button }}
        color={'default'}
        variant={'cointained'}
        onClick={handleSubmitCards}
      >
        submit
      </Button>
    </Slide>
  );
}

const styles = theme => ({
  buttonContainer: {
    position: 'absolute',
    bottom: '3rem',
    left: '50%',
    marinBottom: '10rem',
  },
  button: {
    fontSize: '2rem',
    color: 'white',
    backgroundColor: theme.palette.secondary.main,
    '&:hover': {
      backgroundColor: theme.palette.secondary.dark,
    },
  },
});

export default withStyles(styles)(withSnackbar(SubmitCards));
