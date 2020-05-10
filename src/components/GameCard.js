import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import { Badge, Box, Paper, Typography } from '@material-ui/core';
import ButtonBase from '@material-ui/core/ButtonBase';
import withStyles from '@material-ui/core/styles/withStyles';
import ReactCardFlip from 'react-card-flip';
import renderHTML from 'react-render-html';

const GameCard = props => {
  const [flipped, setFlipped] = useState(true);

  useEffect(() => {
    // a lil bit of flipper action
    const timeout = props.color === 'black' ? 1500 : 500;
    setFlipped(true);
    setTimeout(() => setFlipped(false), timeout);
  }, [props.card.text, props.card.data && props.card.data.text]);

  return (
    <Box classes={{ root: props.classes.cardContainer }}>
      <Badge
        badgeContent={props.badgeContent}
        color="secondary"
        classes={{ anchorOriginTopRightRectangle: props.classes.badge }}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <ButtonBase>
          <ReactCardFlip isFlipped={flipped} flipDirection="horizontal">
            <Paper
              key={'front'}
              classes={{
                root: classnames(props.classes.card, {
                  [props.classes[props.color]]: true,
                }),
              }}
              onClick={() => props.onClick && props.onClick(props.card.data)}
            >
              <Typography classes={{ root: props.classes.cardText }} align={'left'}>
                {renderHTML(`${props.children(props.card)}`)}
              </Typography>
            </Paper>
            <Paper
              key={'back'}
              classes={{
                root: classnames(props.classes.card, {
                  [props.classes[props.color]]: true,
                }),
              }}
              onClick={() => setFlipped(!flipped)}
            >
              <Typography classes={{ root: props.classes.cardText }} align={'left'}>
                Coders Against Humanity
              </Typography>
            </Paper>
          </ReactCardFlip>
        </ButtonBase>
      </Badge>
    </Box>
  );
};

const styles = theme => ({
  cardContainer: {
    margin: '1rem',
  },
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
