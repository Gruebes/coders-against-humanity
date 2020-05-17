import React, { useContext } from 'react';
import Promise from 'bluebird';
import withStyles from '@material-ui/core/styles/withStyles';
import { Dialog } from '@material-ui/core';
import { withSnackbar } from 'notistack';
import { GameCard } from '../../../components';
import { store } from '../../../store';
import { GameContext } from '../gameContext';
import { gameStateTypes } from '../../../enums';
import firebase, { Games } from '../../../firebase';
import { logger } from '../../../logger';

const log = logger.child({ component: 'ChooseBlackModal' });

function ChooseBlackModal(props) {
  const { state } = useContext(store);
  const { state: gameState } = useContext(GameContext);

  const handleChooseBlack = async player => {
    try {
      debugger;
      const chooseBlack = firebase.functions().httpsCallable('chooseBlack');
      const result = await chooseBlack({
        player,
        currentBlackCard: state.game.currentTurn.blackCard,
      });
      log.info(result, 'choose black result');
    } catch (err) {
      debugger;
      logger.error(err, 'Error choosing black card');
    }
  };

  return (
    <>
      {state.game && (
        <Dialog open={state.game.state === gameStateTypes.chooseBlack}>
          {state.otherPlayers && !!state.otherPlayers.length && (
            <>
              {state.otherPlayers.map(player => (
                <GameCard
                  color={'black'}
                  key={player._id}
                  card={gameState.blackCard}
                  onClick={() => handleChooseBlack(player)}
                  renderText={card => {
                    return Object.entries(player.selectedCards).reduce(
                      (text, [localIndex, nextWhiteCard]) => {
                        if (text.includes('_')) {
                          text = text
                            .replace('____', `<u><em>${nextWhiteCard.text}</em></u>`)
                            .replace('.', '');
                        } else {
                          text = `${text} <u><em>${nextWhiteCard.text}</em></u>`;
                        }
                        return text;
                      },
                      card.text
                    );
                  }}
                >
                  <div>
                    {state.game && state.game.currentTurn && state.game.currentTurn.winner && (
                      <div>{state.game.currentTurn.winner}</div>
                    )}
                  </div>
                </GameCard>
              ))}
            </>
          )}
        </Dialog>
      )}
    </>
  );
}

const styles = theme => ({
  container: {},
});

export default withStyles(styles)(withSnackbar(ChooseBlackModal));
