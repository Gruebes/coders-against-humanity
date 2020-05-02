import React, { useContext, useEffect } from 'react';
import {
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@material-ui/core';
import firebase, { Games, Players } from '../../../firebase';
import { store } from '../../../store';
import { withRouter } from 'react-router-dom';
import withStyles from '@material-ui/core/styles/withStyles';
import { withSnackbar } from 'notistack';
import Logger from '../../../logger';
import { gameStateTypes } from '../../../enums';

const logger = new Logger({ location: 'GameBoard' });
function GameBoard(props) {
  const { classes } = props;
  const { dispatch, state } = useContext(store);
  debugger;
  return <div> Game Board</div>;
}

const styles = theme => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: `${theme.spacing(2)}px ${theme.spacing(3)}px ${theme.spacing(3)}px`,
  },
});

export default withRouter(withStyles(styles)(withSnackbar(GameBoard)));
