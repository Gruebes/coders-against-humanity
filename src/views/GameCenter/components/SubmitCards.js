import React, { useContext } from 'react';
import { Players } from 'db';
import withStyles from '@material-ui/core/styles/withStyles';
import { withSnackbar } from 'notistack';
import { Button, Popper } from '@material-ui/core';
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
      gameDispatch({ type: 'SHOW_SUBMIT', data: false });
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
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'center',
        horizontal: 'center',
      }}
    >
      <Button
        classes={{ root: classes.button }}
        color={'default'}
        variant={'cointained'}
        onClick={handleSubmitCards}
      >
        submit
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
