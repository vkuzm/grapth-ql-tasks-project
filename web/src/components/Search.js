import { gql, useLazyQuery } from '@apollo/client';
import React, { useEffect } from 'react';

import { useStore } from '../store';

const SEARCH_RESULTS = gql`
  query searchResults($searchTerm: String!) {
    searchResults: search(term: $searchTerm) {
      type: __typename
      id
      content
        ... on Task {
        approachCount
      }
      ... on Approach {
      task {
        id
        content
      }
     }
    }
  }
`;

export default function Search({ searchTerm = null }) {
  const { setLocalAppState, AppLink } = useStore();
  const [performSearch, { error, loading, data }] = useLazyQuery(SEARCH_RESULTS, {
    variables: { searchTerm },
    skip: !searchTerm, // Performs the query only when there is a searchTerm
  });

  useEffect(() => {
    if (searchTerm) {
      performSearch();
    }
  }, [searchTerm, performSearch]);

  if (error) {
    return <div className="error">{error.message}</div>;
  }

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    const term = event.target.search.value;

    setLocalAppState({
      component: { name: 'Search', props: { searchTerm: term } },
    });
  };

  return (
    <div>
      <div className="main-container">
        <form method="post" onSubmit={handleSearchSubmit}>
          <div className="center">
            <input
              type="search"
              name="search"
              className="input-append"
              defaultValue={searchTerm}
              placeholder="Search all tasks and approaches"
              required
            />
            <div className="">
              <button className="btn btn-append" type="submit">
                Search
              </button>
            </div>
          </div>
        </form>
      </div>
      {data && data.searchResults && (
        <div>
          <h2>Search Results</h2>
          <div className="y-spaced">
            {data.searchResults.length === 0 && (
              <div className="box box-primary">No results</div>
            )}
            {data.searchResults.map((item, index) => (
              <div key={index} className="box box-primary">
                <AppLink
                  to="TaskPage"
                  taskId={
                    item.type === 'Approach' ? item.task.id : item.id
                  }
                >
                  <span className="search-label">{item.type}</span>{' '}
                  {item.content.substr(0, 250)}
                </AppLink>
                <div className="search-sub-line">
                  {item.type === 'Task'
                    ? `Approaches: ${item.approachCount}`
                    : `Task: ${item.task.content.substr(0, 250)}`}
                </div>
              </div>
            ))}
          </div>
          <AppLink to="Home">{'<'} Home</AppLink>
        </div>
      )}
    </div>
  );
}
