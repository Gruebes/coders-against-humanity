import React, { useContext, useEffect } from 'react';
import { AppBar as Bar, Button, Toolbar, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import firebase, { watchOnlineStatus } from '../../firebase';
import { withRouter } from 'react-router-dom';
import { AuthContext } from '../Auth';

function AppBar(props) {
  const { classes } = props;
  const { currentUser } = useContext(AuthContext);

  useEffect(() => {
    watchOnlineStatus(currentUser.uid);
  }, []);

  return (
    <Bar position="static">
      <Toolbar>
        <Typography variant="h6" className={classes.title}>
          CAH | {(currentUser && currentUser.displayName) || 'Welcome '}
        </Typography>
        <Button type="submit" color="inherit" onClick={logout}>
          Logout
        </Button>
      </Toolbar>
    </Bar>
  );

  async function logout() {
    await firebase.auth().signOut();
    props.history.push('/');
  }
}

const styles = theme => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
    color: '#ffffff',
  },
});

export default withRouter(withStyles(styles)(AppBar));
