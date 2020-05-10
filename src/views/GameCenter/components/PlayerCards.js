import React, { useContext, useEffect } from 'react';
import { Box, Grid } from '@material-ui/core';
import { GameCard } from 'components';
import { store } from 'store';
import { GameContext } from '../gameContext.js';
import { withRouter } from 'react-router-dom';
import withStyles from '@material-ui/core/styles/withStyles';
import { withSnackbar } from 'notistack';
import { logger } from 'logger';
import SubmitCards from './SubmitCards';

const log = logger.child({ component: 'PlayerCards' });

function PlayerCards(props) {
  const { classes } = props;
  const { dispatch: gameDispatch, state: gameState } = useContext(GameContext);
  const { state } = useContext(store);

  const handlePickWhite = cardData => {
    const exists = findPick(cardData);
    const selected = Object.entries(gameState.selectedCards);

    // if this card already exists
    if (exists && exists.data.index === cardData.index) {
      // unselect it and remove the higher indexes
      selected.splice(exists.index);
    }
    // if there are already the max number of cards according to the black card
    else if (state.game.currentTurn.blackCard.pick === selected.length) {
      // return and don't add any more
      return;
    } else {
      // add the card
      selected.push([`${selected.length}`, cardData]);
    }
    // format the selected cards into object form
    let toSelect = selected.reduce((acc, [localIndex, data]) => {
      acc[localIndex] = data;
      return acc;
    }, {});

    gameDispatch({ type: 'SET_SELECTED_CARDS', data: toSelect });

    const enableSubmit = state.game.currentTurn.blackCard.pick === selected.length;
    gameDispatch({ type: 'SHOW_SUBMIT', data: enableSubmit });
  };

  useEffect(() => {
    if (state.player && state.player.whiteCards) {
      try {
        const cards = Object.entries(state.player.whiteCards).map(([localIndex, data]) => ({
          localIndex,
          data: { ...data, flipped: true },
        }));
        gameDispatch({ type: 'SET_PLAYER_CARDS', data: cards });
      } catch (err) {
        log.error(err, 'Failed to set players cards');
      }
    }
  }, [state.player && state.player.whiteCards]);

  const findPick = card =>
    Object.entries(gameState.selectedCards).reduce((acc, [index, data], idx) => {
      if (data.index === card.index) acc = { index, data };
      return acc;
    }, null);

  const findPickIndex = card =>
    Object.entries(gameState.selectedCards).reduce((acc, [pickIndex, pickData], idx) => {
      if (pickData.index === card.index) acc = parseInt(pickIndex, 10);
      return acc;
    }, null);

  const setBadgeNumber = index => (typeof index === 'number' ? index + 1 : null);

  return (
    <>
      {gameState.playerCards && (
        <Grid container spacing={2}>
          <Grid item xs={10}>
            <Box classes={{ root: classes.playerCardContainer }}>
              {gameState.playerCards.map(card => (
                <GameCard
                  color={'white'}
                  key={card.localIndex}
                  card={card}
                  onClick={handlePickWhite}
                  children={card => card.data.text}
                  badgeContent={setBadgeNumber(findPickIndex(card.data))}
                />
              ))}
            </Box>
          </Grid>
          <SubmitCards />
        </Grid>
      )}
    </>
  );
}

const styles = theme => ({
  playerCardContainer: {
    display: 'flex',
    flexFlow: 'row wrap',
  },
});

export default withRouter(withStyles(styles)(withSnackbar(PlayerCards)));
