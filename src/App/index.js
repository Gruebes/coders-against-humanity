import React from 'react';
import './styles.css';
import { AuthProvider } from '../views/Auth';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { CssBaseline } from '@material-ui/core';
import Dashboard from '../views/Dashboard';
import AppBar from '../views/AppBar';
import GameCenter from '../views/GameCenter';
import HomePage from '../views/HomePage';
import Login from '../views/Login';
import { MuiThemeProvider } from '@material-ui/core/styles';
import PrivateRoute from '../views/PrivateRoute';
import Register from '../views/Register';
import { StateProvider } from '../store';
import { SnackbarProvider } from 'notistack';

import theme from './theme';

export default function App() {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <StateProvider>
          <SnackbarProvider maxSnack={8}>
            <Router>
              <AppBar />
              <Switch>
                <PrivateRoute exact path="/" component={HomePage} />
                <Route exact path="/login" component={Login} />
                <Route exact path="/register" component={Register} />
                <PrivateRoute exact path="/dashboard" component={Dashboard} />
                <PrivateRoute exact path="/game-center" component={GameCenter} />
              </Switch>
            </Router>
          </SnackbarProvider>
        </StateProvider>
      </AuthProvider>
    </MuiThemeProvider>
  );
}
