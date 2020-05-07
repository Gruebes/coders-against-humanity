import React from 'react';
import classnames from 'classnames';
import { Badge, Grid, Paper, Typography } from '@material-ui/core';
import ButtonBase from '@material-ui/core/ButtonBase';
import withStyles from '@material-ui/core/styles/withStyles';

const GameCard = props => {
  return (
    <Grid item xs={2} spacing={3}>
      <Badge
        badgeContent={props.badgeContent}
        color="secondary"
        classes={{ anchorOriginTopRightRectangle: props.classes.badge }}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <ButtonBase>
          <Paper
            classes={{
              root: classnames(props.classes.card, {
                [props.classes[props.color]]: true,
              }),
            }}
            onClick={() => props.onClick && props.onClick(props.card.data)}
          >
            <Typography classes={{ root: props.classes.cardText }} align={'left'}>
              {props.children(props.card)}
            </Typography>
          </Paper>
        </ButtonBase>
      </Badge>
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
  black: {
    backgroundColor: '#000000',
    color: '#ffffff',
  },
  white: {
    backgroundColor: '#ffffff',
    color: '#000000',
  },
  badge: {
    transform: 'scale(1.2) translate(50%, -50%)',
  },
});

export default withStyles(styles)(GameCard);
