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

  const handleSubmitChoices = cardData => {
    // const playerRef = Players.doc(state._playerId);
    // TODO: Need to keep track of number of cards selected according to the current black cards
    // once all of the cards are chosen, update player object with choices
    // (the action above will trigger the player cloud function watcher to trade cards for the selected)
  };

  useEffect(() => {
    if (state.player && state.player.whiteCards) {
      try {
        const { bottomRow, topRows } = Object.entries(state.player.whiteCards).reduce(
          (acc, [localIndex, data]) => {
            const card = { localIndex, data };
            if (acc.topRows.length < 5) {
              acc.topRows.push(card);
            } else {
              acc.bottomRow.push(card);
            }
            return acc;
          },
          { topRows: [], bottomRow: [] }
        );

        gameDispatch({ type: 'SET_TOP_ROW', data: topRows });
        gameDispatch({ type: 'SET_BOTTOM_ROW', data: bottomRow });
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
      {gameState.bottomRowCards && gameState.topRowCards && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Grid container>
              {gameState.topRowCards.map(card => (
                <GameCard
                  color={'white'}
                  key={card.localIndex}
                  card={card}
                  onClick={handlePickWhite}
                  children={card => card.data.text}
                  badgeContent={setBadgeNumber(findPickIndex(card.data))}
                />
              ))}
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Grid container>
              {gameState.bottomRowCards.map(card => (
                <GameCard
                  color={'white'}
                  key={card.localIndex}
                  card={card}
                  onClick={handlePickWhite}
                  children={card => card.data.text}
                  badgeContent={setBadgeNumber(findPickIndex(card.data))}
                />
              ))}
            </Grid>
          </Grid>
          <SubmitCards />
        </Grid>
      )}
    </>
  );
}

const styles = theme => ({
  // playerCardContainer: {
  //   position: 'absolute',
  //   width: '100%',
  //   maxWidth: '120rem',
  //   bottom: '2rem',
  //   left: '5rem',
  // },
});

export default withRouter(withStyles(styles)(withSnackbar(PlayerCards)));
