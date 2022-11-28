import { graphqlHTTP } from 'express-graphql';
import { schema } from './schema';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import pgApiWrapper from './db/pg-api';
import mongoApiWrapper from './db/mongo-api';
import DataLoader from 'dataloader';
import * as config from './config';

async function main() {
  const pgApi = await pgApiWrapper();
  const mongoApi = await mongoApiWrapper();
  const server = express();

  const mutators = {
    ...pgApi.mutators,
    ...mongoApi.mutators,
  };

  server.use(cors({ origin: '*' }));
  server.use('/', async (req, res) => {
    const authToken = req && req.headers && req.headers.authorization
      ? req.headers.authorization.slice(7) // "Bearer "
      : null;

    const currentUser = await pgApi.userFromAuthToken(authToken);
    if (authToken && !currentUser) {
      return res.status(401).send({
        errors: [{ message: 'Invalid access token' }],
      });
    }

    const loaders = {
      users: new DataLoader((userIds) => pgApi.usersInfo(userIds)),
      approachLists: new DataLoader((taskIds) => pgApi.approachLists(taskIds)),
      tasks: new DataLoader((taskIds) => pgApi.tasksInfo({ taskIds, currentUser })),
      tasksByTypes: new DataLoader((types) => pgApi.tasksByTypes(types)),
      searchResults: new DataLoader((searchTerms) => pgApi.searchResults({ searchTerms, currentUser })),
      detailLists: new DataLoader((approachIds) => mongoApi.detailLists(approachIds)),
      tasksForUsers: new DataLoader((userIds) => pgApi.tasksForUsers(userIds)),
    };

    graphqlHTTP({
      schema,
      context: { loaders, mutators, currentUser },
      graphiql: { headerEditorEnabled: true },
      customFormatErrorFn: (err) => {
        const errorReport = {
          message: err.message,
          locations: err.locations,
          stack: err.stack ? err.stack.split('\n') : [],
          path: err.path,
        };

        console.error('GraphQL Error', errorReport);
        return config.isDev ? errorReport : { message: 'Oops! Something went wrong! :(' };
      },
    })(req, res);
  });

  server.listen(config.port, () => {
    console.log(`Server URL: http://localhost:${config.port}/`);
  });
}

main();

/** GIA NOTES
 *
 * Use the code below to start a bare-bone express web server

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';

import * as config from './config';

async function main() {
  const server = express();
  server.use(cors());
  server.use(morgan('dev'));
  server.use(bodyParser.urlencoded({ extended: false }));
  server.use(bodyParser.json());
  server.use('/:fav.ico', (req, res) => res.sendStatus(204));

  // Example route
  server.use('/', (req, res) => {
    res.send('Hello World');
  });

  // This line rus the server
  server.listen(config.port, () => {
    console.log(`Server URL: http://localhost:${config.port}/`);
  });
}

main();

*/
