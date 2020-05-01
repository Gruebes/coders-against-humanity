import React, { useContext } from 'react';
import { Button, FormControl, InputLabel, MenuItem, Select, Paper } from '@material-ui/core';
import withStyles from '@material-ui/core/styles/withStyles';
import { Games, Players } from '../../../firebase';
import { withRouter } from 'react-router-dom';
import { AuthContext } from '../../Auth';
import { store } from '../../../store';
import { getGameObject, getPlayerObject } from '../../utils';
import Logger from '../../../logger';

const logger = new Logger({ location: 'CreateGame' });

function CreateGame(props) {
  const { classes } = props;
  const { currentUser } = useContext(AuthContext);
  const { dispatch, state } = useContext(store);

  const handleCreate = async () => {
    dispatch({ type: 'SET_AWAITING_GAME', data: true });
    const { gameData, playerData } = await createGameObjects();
    // set objects data on state
    dispatch({ type: 'SET_IS_HOST', data: true });
    dispatch({ type: 'SET_GAME', data: gameData });
    dispatch({ type: 'SET_PLAYER', data: playerData });
    logger.info({ _gameId: gameData._id, _playerId: playerData._id }, 'Created Game Objects');
    props.moveToGameCenter(gameData._id, playerData._id);
  };

  const createGameObjects = async () => {
    // Create/Set player and game objects
    const gameRef = Games.doc();
    const playerRef = Players.doc();
    await gameRef.set(getGameObject(currentUser, state.cardsToWin, state.playerCount, playerRef.id));
    await playerRef.set(getPlayerObject(currentUser, gameRef.id, true));
    const gameData = { ...(await gameRef.get()).data(), _id: gameRef.id };
    const playerData = { ...(await playerRef.get()).data(), _id: playerRef.id };
    return { gameData, playerData };
  };

  return (
    <Paper className={classes.paper}>
      <div className={classes.selectors}>
        <FormControl className={classes.formControl}>
          <div></div>
          <InputLabel id="player-count-label">Player Count</InputLabel>
          <Select
            labelId="player-count-label"
            id="player-count"
            value={state.playerCount}
            onChange={e => dispatch({ type: 'SET_PLAYER_COUNT', data: e.target.value })}
          >
            {[4, 5, 6, 7, 8].map((count, i) => (
              <MenuItem key={i} value={count}>
                {count}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl className={classes.formControl}>
          <InputLabel id="cards-to-win-label">Cards To Win</InputLabel>
          <Select
            labelId="cards-to-win-label"
            id="cards-to-win"
            value={state.cardsToWin}
            onChange={e => dispatch({ type: 'SET_CARDS_TO_WIN', data: e.target.value })}
          >
            {[7, 8, 9, 10].map((count, i) => (
              <MenuItem key={i} value={count}>
                {count}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
      <Button
        type="submit"
        fullWidth
        variant="outlined"
        color="secondary"
        onClick={handleCreate}
        className={classes.submit}
      >
        Create Game
      </Button>
    </Paper>
  );
}

const styles = theme => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: `${theme.spacing(2)}px ${theme.spacing(3)}px ${theme.spacing(3)}px`,
  },
  selectors: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  formControl: {
    width: '48%',
  },
  avatar: {
    margin: theme.spacing(),
    backgroundColor: theme.palette.secondary.main,
  },
  submit: {
    marginTop: theme.spacing(3),
  },
});

export default withRouter(withStyles(styles)(CreateGame));
