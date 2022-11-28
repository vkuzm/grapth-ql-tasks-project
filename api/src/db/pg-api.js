import pgClient from './pg-client';
import sqls from './sqls';
import { randomString } from '../utils';

const pgApiWrapper = async () => {
  const { pgPool } = await pgClient();

  const pgQuery = (text, params = {}) => {
    return pgPool.query(text, Object.values(params));
  };

  return {
    taskMainList: async () => {
      const tasks = await pgQuery(sqls.tasksLatest);
      return tasks.rows;
    },
    userInfo: async (userId) => {
      const users = await pgQuery(sqls.usersFromIds, { $1: [userId] });
      return users.rows[0];
    },
    usersInfo: async (userIds) => {
      const users = await pgQuery(sqls.usersFromIds, { $1: userIds });
      return userIds.map((userId) => {
        return users.rows.find((row) => userId === row.id);
      });
    },
    approachList: async (taskId) => {
      const approaches = await pgQuery(sqls.approachesForTaskIds, { $1: [taskId] });
      return approaches.rows;
    },
    approachLists: async (taskIds) => {
      const approaches = await pgQuery(sqls.approachesForTaskIds, { $1: taskIds });

      return taskIds.map((taskId) => {
        return approaches.rows.filter((row) => taskId === row.taskId);
      });
    },
    tasksInfo: async ({ taskIds, currentUser }) => {
      const taskInfos = await pgQuery(sqls.tasksFromIds, {
        $1: taskIds,
        $2: currentUser ? currentUser.id : null,
      });

      return taskIds.map((taskId) => {
        return taskInfos.rows.find((row) => taskId == row.id);
      });
    },
    tasksByTypes: async (types) => {
      const results = types.map(async (type) => {
        if (type === 'latest') {
          const pgResp = await pgQuery(sqls.tasksLatest);
          return pgResp.rows;
        }

        throw Error('Unsupported type');
      });

      return Promise.all(results);
    },
    searchResults: async ({ searchTerms, currentUser }) => {
      const results = searchTerms.map(async (searchTerm) => {
        const pgResp = await pgQuery(sqls.searchResults, {
          $1: searchTerm,
          $2: currentUser ? currentUser.id : null,
        });

        return pgResp.rows;
      });

      return Promise.all(results);
    },
    userFromAuthToken: async (authToken) => {
      if (!authToken) {
        return null;
      }
      const pgResp = await pgQuery(sqls.userFromAuthToken, {
        $1: authToken,
      });

      return pgResp.rows[0];
    },
    tasksForUsers: async (userIds) => {
      const pgResp = await pgQuery(sqls.tasksForUsers, {
        $1: userIds,
      });

      return userIds.map((userId) => {
        return pgResp.rows.filter((row) => userId === row.userId)
      })
    },
    mutators: {
      userCreate: async ({ input }) => {
        const payload = { errors: [] };

        if (input.password.length < 6) {
          payload.errors.push({
            message: 'Use a stronger password',
          });
        }

        if (payload.errors.length === 0) {
          const authToken = randomString();
          try {
            const pgResp = await pgQuery(sqls.userInsert, {
              $1: input.username.toLowerCase(),
              $2: input.password,
              $3: input.firstName,
              $4: input.lastName,
              $5: authToken,
            });

            if (pgResp.rows[0]) {
              payload.user = pgResp.rows[0];
              payload.authToken = authToken;
            }
          } catch (err) {
            console.error(err);
            // Check the err object and either:
            // - Push a custom error message to payload
            // - Throw the err object again }
          }
        }

        return payload;
      },
      userDelete: async ({ currentUser }) => {
        const payload = { errors: [] };

        try {
          await pgQuery(sqls.userDelete, { $1: currentUser.id });
          payload.deletedUserId = currentUser.id;
        } catch (err) {
          payload.errors.push({ message: 'We were not able to delete this account' });
        }

        return payload;
      },
      userLogin: async ({ input }) => {
        const payload = { errors: [] };

        if (!input.username || !input.password) {
          payload.errors.push({
            message: 'Invalid username or password',
          });
        }

        if (payload.errors.length === 0) {
          const pgResp = await pgQuery(sqls.userFromCredentials, {
            $1: input.username.toLowerCase(),
            $2: input.password,
          });

          const user = pgResp.rows[0];

          if (user) {
            const authToken = randomString();
            await pgQuery(sqls.userUpdateAuthToken, {
              $1: user.id,
              $2: authToken,
            });

            payload.user = user;
            payload.authToken = authToken;

          } else {
            payload.errors.push({
              message: 'Invalid username or password'
            });
          }
        }

        return payload;
      },
      taskCreate: async ({ input, currentUser }) => {
        const payload = { errors: [] };

        if (input.content.length < 15) {
          payload.errors.push({
            message: 'Text is too short',
          });
        }

        if (payload.errors.length === 0) {
          const pgResp = await pgQuery(sqls.taskInsert, {
            $1: currentUser.id,
            $2: input.content,
            $3: input.tags.join(','),
            $4: input.isPrivate,
          });

          if (pgResp.rows[0]) {
            payload.task = pgResp.rows[0];
          }
        }

        return payload;
      },
      approachCreate: async ({
        taskId,
        input,
        currentUser,
        mutators,
      }) => {
        const payload = { errors: [] };
        if (payload.errors.length === 0) {
          const pgResp = await pgQuery(sqls.approachInsert, {
            $1: currentUser.id,
            $2: input.content,
            $3: taskId,
          });

          if (pgResp.rows[0]) {
            payload.approach = pgResp.rows[0];

            await pgQuery(sqls.approachCountIncrement, {
              $1: taskId,
            });

            await mutators.approachDetailCreate(
              payload.approach.id,
              input.detailList,
            );
          }
        }

        return payload;
      },
      approachVote: async ({ approachId, input }) => {
        const payload = { errors: [] };
        const pgResp = await pgQuery(sqls.approachVote, {
          $1: approachId,
          $2: input.up ? 1 : -1,
        });

        if (pgResp.rows[0]) {
          payload.approach = pgResp.rows[0];
        }

        return payload;
      },
    },
  };
};

export default pgApiWrapper;