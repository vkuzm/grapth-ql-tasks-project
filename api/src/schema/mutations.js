import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
} from 'graphql';
import ApproachPayload from './types/approach-payload';
import ApproachVoteInput from './types/approach-vote-input';
import AuthInput from './types/auth-input';
import ApproachInput from './types/input-approach';
import TaskInput from './types/task-input';
import TaskPayload from './types/task-payload';
import UserDeletePayload from './types/user-delete-payload';
import UserInput from './types/user-input';
import UserPayload from './types/user-payload';

const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    userCreate: {
      type: new GraphQLNonNull(UserPayload),
      args: {
        input: { type: new GraphQLNonNull(UserInput) },
      },
      resolve: async (source, { input }, { mutators }) => {
        return mutators.userCreate({ input });
      },
    },
    userDelete: {
      type: UserDeletePayload,
      resolve: async (source, args, { mutators, currentUser }) => {
        return mutators.userDelete({ currentUser });
      },
    },
    userLogin: {
      type: new GraphQLNonNull(UserPayload),
      args: {
        input: { type: new GraphQLNonNull(AuthInput) },
      },
      resolve: async (source, { input }, { mutators }) => {
        return mutators.userLogin({ input });
      },
    },
    taskCreate: {
      type: TaskPayload,
      args: {
        input: { type: new GraphQLNonNull(TaskInput) },
      },
      resolve: async (source, { input }, { mutators, currentUser }) => {
        return mutators.taskCreate({ input, currentUser });
      },
    },
    approachCreate: {
      type: ApproachPayload,
      args: {
        taskId: { type: new GraphQLNonNull(GraphQLID) },
        input: { type: new GraphQLNonNull(ApproachInput) },
      },
      resolve: async (source, { taskId, input }, { mutators, currentUser }) => {
        return mutators.approachCreate({
          taskId,
          input,
          currentUser,
          mutators,
        });
      },
    },
    approachVote: {
      type: new GraphQLNonNull(ApproachPayload),
      args: {
        approachId: { type: new GraphQLNonNull(GraphQLID) },
        input: { type: new GraphQLNonNull(ApproachVoteInput) },
      },
      resolve: async (source, { approachId, input }, { mutators }) => {
        return mutators.approachVote({ approachId, input });
      },
    },
  }),
});

export default MutationType;