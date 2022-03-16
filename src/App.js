import React from 'react';
import { Switch, Route, BrowserRouter, Redirect } from 'react-router-dom';

import { useBlockchainContext } from "./context";

import Welcome from './components/welcome';
import Main from './components/main';
import { NotificationContainer } from 'react-notifications';
import './App.css';
import 'react-notifications/lib/notifications.css';

function App() {
  const [state,
    {
    }] = useBlockchainContext();

  return (
    <BrowserRouter>
      <Switch>
        <Route exact path='/' component={Welcome} />
        <Route exact path='/play'>
          {!state.userstate ? <Redirect to="/" /> : <Main />}
        </Route>
        <NotificationContainer />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
