import 'regenerator-runtime/runtime';
import React from 'react';
import ReactDOM from 'react-dom';
import { useStoreObject, Provider as StoreProvider } from './store';
import Root from './components/Root';
import { ApolloProvider } from '@apollo/client';

export default function App() {
  const store = useStoreObject();

  return (
    <ApolloProvider client={store.client}>
      <StoreProvider value={store}>
        <Root />
      </StoreProvider>
    </ApolloProvider>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
