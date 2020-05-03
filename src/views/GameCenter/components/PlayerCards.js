import React, { useContext, useEffect, useState } from 'react';
import { Grid, Paper, Typography } from '@material-ui/core';
import { Players } from '../../../firebase';
import { store } from '../../../store';
import { withRouter } from 'react-router-dom';
import withStyles from '@material-ui/core/styles/withStyles';
import { withSnackbar } from 'notistack';
import Logger from '../../../logger';

const logger = new Logger({ location: 'PlayerCards' });
function PlayerCards(props) {
  const { classes } = props;
  const { dispatch, state } = useContext(store);

  const [topRowCards, setTopRowCards] = useState(null);
  const [bottomRowCards, setBottomRowCards] = useState(null);

  const handlePickWhite = cardData => {
    const playerRef = Players.doc(state._playerId);
    // TODO: Need to keep track of number of cards selected according to the current black cards
    // once all of the cards are chosen, update player object with choices
    // (the action above will trigger the player cloud function watcher to trade cards for the selected)
  };

  useEffect(() => {
    if (state.player && state.player.whiteCards) {
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
      setTopRowCards(topRows);
      setBottomRowCards(bottomRow);
    }
  }, [state.player && state.player.whiteCards]);

  return (
    <div>
      {bottomRowCards && topRowCards && (
        <Grid container className={classes.root} spacing={2}>
          <Grid container justify="center" spacing={2}>
            {topRowCards.map(card => (
              <GameCard
                key={card.localIndex}
                classes={classes}
                card={card}
                handlePickWhite={handlePickWhite}
              />
            ))}
          </Grid>
          <Grid container justify="center" spacing={2}>
            {bottomRowCards.map(card => (
              <GameCard
                key={card.localIndex}
                classes={classes}
                card={card}
                handlePickWhite={handlePickWhite}
              />
            ))}
          </Grid>
        </Grid>
      )}
    </div>
  );
}

const GameCard = props => {
  return (
    <Grid item>
      <Paper
        classes={{ root: props.classes.card }}
        onClick={() => props.handlePickWhite(props.card.data)}
      >
        <Typography classes={{ root: props.classes.cardText }} align={'left'}>
          {props.card.data.text}
        </Typography>
      </Paper>
    </Grid>
  );
};

const styles = theme => ({
  card: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    padding: `${theme.spacing(2)}px ${theme.spacing(3)}px ${theme.spacing(3)}px`,
    width: '17rem',
    height: '27rem',
    alignItems: 'flex-start',
  },
  cardText: {
    fontWeight: theme.typography.fontWeightBold,
    fontSize: '1.35rem',
  },
});

export default withRouter(withStyles(styles)(withSnackbar(PlayerCards)));
