import React, { useState, useEffect } from 'react';

import { useStore } from '../store';
import Search from './Search';
import TaskSummary, { TASK_SUMMARY_FRAGMENT } from './TaskSummary';

const TASK_MAIN_LIST = `
  query taskMainList {
    taskMainList {
      id
      ...TaskSummary
    }
  }
  ${TASK_SUMMARY_FRAGMENT}
`;

// const mockTasks = [
//   {
//     id: 1,
//     content: 'Mock content #1',
//     author: { username: 'mock-author' },
//     tags: ['tag1', 'tag2'],
//   },
//   {
//     id: 2,
//     content: 'Mock content #2',
//     author: { username: 'mock-author' },
//     tags: ['tag1', 'tag2'],
//   },
//   {
//     id: 3,
//     content: 'Mock content #3',
//     author: { username: 'mock-author' },
//     tags: ['tag1', 'tag2'],
//   },
// ];

export default function Home() {
  const { request } = useStore();
  const [taskList, setTaskList] = useState(null);

  useEffect(() => {
    request('{ currentTime }').then(({ data }) => {
      console.log(`Server time is: ${data.currentTime}`);
    });

    request(TASK_MAIN_LIST).then(({ data }) => {
      setTaskList(data.taskMainList);
    });

  }, [request]);

  if (!taskList) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <Search />
      <div>
        <h1>Latest</h1>
        {taskList.map((task) => (
          <TaskSummary key={task.id} task={task} link={true} />
        ))}
      </div>
    </div>
  );
}
