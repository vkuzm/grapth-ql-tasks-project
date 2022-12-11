import React, { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import NewApproach from './NewApproach';
import Approach, { APPROACH_FRAGMENT } from './Approach';
import TaskSummary, { TASK_SUMMARY_FRAGMENT } from './TaskSummary';
import { useStore } from '../store';

export const FULL_TASK_FRAGMENT = gql`
  fragment FullTaskData on Task {
    id
    ...TaskSummary
    approachList {
      id
      ...ApproachFragment
    }
  }
  ${TASK_SUMMARY_FRAGMENT}
  ${APPROACH_FRAGMENT}
`;

const TASK_INFO = gql`
  query taskInfo($taskId: ID!) {
    taskInfo(id: $taskId) {
      id
      ...TaskSummary
      approachList {
        id
        ...ApproachFragment
      }
    }
  }
  ${TASK_SUMMARY_FRAGMENT}
  ${APPROACH_FRAGMENT}
`;

export default function TaskPage({ taskId }) {
  // const [ taskInfo, setTaskInfo ] = useState(null);
  const { AppLink } = useStore();
  const [showAddApproach, setShowAddApproach] = useState(false);
  const [highlightedApproachId, setHighlightedApproachId] = useState();

  const { error, loading, data } = useQuery(TASK_INFO, {
    variables: { taskId },
  });

  if (error) {
    return <div className="error">{error.message}</div>;
  }

  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  const { taskInfo } = data;
  if (!taskInfo) {
    return <div className="loading">Loading...</div>;
  }

  const handleAddNewApproach = (addNewApproach) => {
    // setTaskInfo((pTask) => ({
    //   ...pTask,
    //   approachList: [newApproach, ...pTask.approachList],
    // }));
    const newApproachId = addNewApproach(taskInfo);
    setHighlightedApproachId(newApproach.id);
    setShowAddApproach(false);
  };

  return (
    <div>
      <AppLink to="Home">{'<'} Home</AppLink>
      <TaskSummary task={taskInfo} />
      <div>
        <div>
          {showAddApproach ? (
            <NewApproach
              taskId={taskId}
              onSuccess={handleAddNewApproach}
            />
          ) : (
            <div className="center y-spaced">
              <button
                onClick={() => setShowAddApproach(true)}
                className="btn btn-secondary"
              >
                + Add New Approach
              </button>
            </div>
          )}
        </div>
        <h2>Approaches ({taskInfo.approachList.length})</h2>
        {taskInfo.approachList.map((approach) => (
          <div key={approach.id} id={approach.id}>
            <Approach
              approach={approach}
              isHighlighted={highlightedApproachId === approach.id}
            />
          </div>
        ))}
      </div>
    </div>
  );
}