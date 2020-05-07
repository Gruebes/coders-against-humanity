import React, { useContext, useEffect } from 'react';
import { Grid } from '@material-ui/core';
import { GameCard } from 'components';
import LeaderBoard from './LeaderBoard';
import { store } from 'store';
import { GameContext } from '../gameContext.js';
import { withRouter } from 'react-router-dom';
import withStyles from '@material-ui/core/styles/withStyles';
import { withSnackbar } from 'notistack';
import { logger } from 'logger';

const log = logger.child({ component: 'GameDetails' });

function GameDetails(props) {
  const { dispatch: gameDispatch, state: gameState } = useContext(GameContext);
  const { state } = useContext(store);

  useEffect(() => {
    if (state.game.currentTurn.blackCard) {
      try {
        gameDispatch({ type: 'SET_BLACK_CARD', data: state.game.currentTurn.blackCard });
      } catch (err) {
        log.child(err, 'Failed to SET_BLACK_CARD');
      }
    }
  }, [gameState.selectedCards, state.game.currentTurn.blackCard]);

  return (
    <div>
      {gameState.blackCard && (
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <GameCard
              color={'black'}
              key={gameState.blackCard.index}
              card={gameState.blackCard}
              children={card => {
                return Object.entries(gameState.selectedCards).reduce(
                  (text, [localIndex, nextWhiteCard]) => {
                    text = text.replace('_', nextWhiteCard.text);
                    text = text.replace('.', '');
                    return text;
                  },
                  card.text
                );
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <LeaderBoard />
          </Grid>
        </Grid>
      )}
    </div>
  );
}

const styles = theme => ({});

export default withRouter(withStyles(styles)(withSnackbar(GameDetails)));
