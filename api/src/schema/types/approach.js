import {
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql';
import ApproachDetail from './approach-detail';
import SearchResultItem from './search-result-item';
import Task from './task';
import User from './user';

const Approach = new GraphQLObjectType({
  name: 'Approach',
  interfaces: () => [SearchResultItem],
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    voteCount: { type: new GraphQLNonNull(GraphQLInt) },
    createdAt: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ createdAt }) => createdAt.toISOString(),
    },
    author: {
      type: new GraphQLNonNull(User),
      resolve: (source, args, { pgApi, loaders }) => {
        return loaders.users.load(source.userId);
      }
    },
    task: {
      type: new GraphQLNonNull(Task),
      resolve: (source, args, { loaders }) => {
        return loaders.tasks.load(source.taskId);
      }
    },
    detailList: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ApproachDetail))
      ),
      resolve: (source, args, { loaders }) => {
        return loaders.detailLists.load(source.id);
      }
    },
  })
});

export default Approach;