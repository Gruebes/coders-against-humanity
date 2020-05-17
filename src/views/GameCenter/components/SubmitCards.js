import React, { useContext } from 'react';
import firebase from '../../../firebase';
import withStyles from '@material-ui/core/styles/withStyles';
import { withSnackbar } from 'notistack';
import { Button, Popper, CircularProgress } from '@material-ui/core';
import { GameContext } from '../gameContext.js';
import { store } from '../../../store';
import { logger } from '../../../logger';

const log = logger.child({ component: 'SubmitCards' });
function SubmitCards(props) {
  const { classes } = props;
  const { state } = useContext(store);
  const { dispatch: gameDispatch, state: gameState } = useContext(GameContext);

  const handleSubmitCards = async () => {
    try {
      gameDispatch({ type: 'TRADING', data: true });
      const tradeCards = firebase.functions().httpsCallable('tradeCards');
      const result = await tradeCards({
        _gameId: state._gameId,
        _playerId: state._playerId,
        selectedCards: gameState.selectedCards,
      });
      log.info({}, 'Submitting cards');
      gameDispatch({ type: 'SHOW_SUBMIT', data: false });
      gameDispatch({ type: 'TRADING', data: false });
      gameDispatch({ type: 'SET_SELECTED_CARDS', data: {} });
    } catch (err) {
      log.error(err, 'error submitting cards');
      props.enqueueSnackbar(err.message, {
        variant: 'error',
      });
    }
  };

  // https://material-ui.com/components/popper/#scroll-playground
  // OR
  // https://material-ui.com/components/drawers
  return (
    <Popper
      open={gameState.showSubmit}
      style={{ position: 'fixed', bottom: '1rem', right: 'unset', top: 'unset', left: '45%' }}
    >
      <Button
        classes={{ root: classes.button }}
        color={'default'}
        variant={'cointained'}
        onClick={handleSubmitCards}
        disabled={gameState.trading}
      >
        {gameState.trading ? <CircularProgress /> : 'submit'}
      </Button>
    </Popper>
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
    // width: '25%',
  },
});

export default withStyles(styles)(withSnackbar(SubmitCards));
