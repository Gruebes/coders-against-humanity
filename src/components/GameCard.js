import React from 'react';
import { Grid, Paper, Typography } from '@material-ui/core';
import withStyles from '@material-ui/core/styles/withStyles';
import Logger from '../../../logger';
import { GameCard } from 'components';

const logger = new Logger({ location: 'GameCard' });
const GameCard = props => {
  return (
    <Grid item xs={2}>
      <Paper classes={{ root: props.classes.card }} onClick={() => props.onClick(props.card.data)}>
        <Typography classes={{ root: props.classes.cardText }} align={'left'}>
          {props.card.data.text}
        </Typography>
      </Paper>
    </Grid>
  );
};

const styles = theme => ({
  card: {
    display: 'flex',
    flexDirection: 'column',
    padding: `${theme.spacing(2)}px ${theme.spacing(3)}px ${theme.spacing(3)}px`,
    width: '17rem',
    height: '25rem',
    alignItems: 'flex-start',
  },
  cardText: {
    fontWeight: theme.typography.fontWeightBold,
    fontSize: '1.35rem',
  },
});

export default withStyles(styles)(GameCard);
