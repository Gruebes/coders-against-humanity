import React from 'react';
import { withRouter } from 'react-router-dom';
import withStyles from '@material-ui/core/styles/withStyles';
import { withSnackbar } from 'notistack';
import Logger from '../../../logger';
import PlayerCards from './PlayerCards';

const logger = new Logger({ location: 'GameBoard' });
function GameBoard(props) {
  return <PlayerCards />;
}

const styles = theme => ({});

export default withRouter(withStyles(styles)(withSnackbar(GameBoard)));
