import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLList,
  GraphQLID,
} from 'graphql';
import { numbersInRangeObject } from '../utils';
import Approach from './types/approach';
import NumbersInRange from './types/numbers-in-range';
import SearchResultItem from './types/search-result-item';
import Task from './types/task';
import User from './types/user';
import { Me } from './types/user';

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    currentTime: {
      type: GraphQLString,
      resolve: () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            const isoString = new Date().toISOString();
            resolve(isoString.slice(11, 19));
          }, 5000);
        });
      }
    },
    sumNumbersInRange: {
      type: NumbersInRange,
      args: {
        begin: { type: new GraphQLNonNull(GraphQLInt) },
        end: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: (source, { begin, end }) => {
        if (end < begin) {
          throw Error(`Invalid range because ${end} < ${begin}`);
        }

        return numbersInRangeObject(begin, end);
      },
    },
    taskMainList: {
      type: new GraphQLList(new GraphQLNonNull(Task)),
      resolve: async (source, args, { loaders }) => {
        return loaders.tasksByTypes.load('latest');
      },
    },
    approachesMainList: {
      type: new GraphQLList(new GraphQLNonNull(Approach)),
      args: {
        taskId: { type: new GraphQLNonNull(GraphQLInt) }
      },
      resolve: async (source, { taskId }, { pgApi }) => {
        return pgApi.approachList(taskId);
      },
    },
    taskInfo: {
      type: Task,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (source, args, { loaders }) => {
        return loaders.tasks.load(args.id);
      },
    },
    search: {
      type: new GraphQLList(new GraphQLNonNull(SearchResultItem)),
      args: {
        term: { type: new GraphQLNonNull(GraphQLString) } 
      },
      resolve: async (source, args, { loaders }) => {
        return loaders.searchResults.load(args.term);
      }
    },
    me: {
      type: Me,
      resolve: (source, args, { currentUser }) => {
        return currentUser;
      }
    }
  }
});

export default QueryType;