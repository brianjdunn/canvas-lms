/*
 * Copyright (C) 2021 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {useEffect, useRef} from 'react'
import {useApolloClient, useQuery} from 'react-apollo'
import useCanvasContext from './useCanvasContext'
import I18n from 'i18n!OutcomeManagement'
import {showFlashAlert} from '@canvas/alerts/react/FlashAlert'
import {SEARCH_GROUP_OUTCOMES} from '@canvas/outcomes/graphql/Management'
import {uniqWith, uniqBy, isEqual} from 'lodash'
import {gql} from '@canvas/apollo'

const useAbortController = dependencies => {
  const abortRef = useRef()
  const previousDependencies = useRef()
  const dependenciesString = dependencies.join('-')

  // if the dependencies changes, abort previous request
  // and return a new controller
  if (previousDependencies.current !== dependenciesString) {
    // There is a issue in aborting controller,
    // it'll be handled in OUT-4630, so leave it comment for now

    // abortRef.current?.abort()
    abortRef.current = new window.AbortController()
    previousDependencies.current = dependenciesString
  }

  return abortRef.current
}

// If searchString size if 1 or 2, return previous searchString
const useSearchString = searchString => {
  const str = searchString || ''
  const ref = useRef('')

  if (![1, 2].includes(str.length)) {
    ref.current = str
  }

  return ref.current
}

const useGroupDetail = ({
  query = SEARCH_GROUP_OUTCOMES,
  loadOutcomesIsImported = false,
  searchString = '',
  id
}) => {
  const {contextType, contextId, rootIds} = useCanvasContext()
  searchString = useSearchString(searchString)
  const abortController = useAbortController([id, searchString])
  const queryVars = {outcomesContextType: contextType, outcomesContextId: contextId}
  const client = useApolloClient()
  const allVariables = useRef([])

  if (searchString) queryVars.searchQuery = searchString

  const skip = !id || rootIds.includes(id)
  const variables = {
    id,
    outcomeIsImported: loadOutcomesIsImported,
    ...queryVars
  }

  const {loading, error, data, fetchMore} = useQuery(query, {
    variables,
    skip,
    context: {
      fetchOptions: {
        signal: abortController.signal
      }
    },
    onCompleted: () => {
      allVariables.current = uniqWith([...allVariables.current, variables], isEqual)
    }
  })

  // this will handle the case when we click in group 1, wait for group 1
  // load to finish, then click in a different group
  // it'll issue a query to load the second group
  // but until the query finishs the first group will be in the cache,
  // and we don't want to return the first group if
  // we're loading the second group.
  // So consider group is null if group id doesn't match
  let group = data?.group
  if ((group?._id || '') !== id) {
    group = null
  }

  useEffect(() => {
    if (error) {
      showFlashAlert({
        message: I18n.t('An error occurred while loading selected group.'),
        type: 'error'
      })
    }
  }, [error])

  const loadMore = () => {
    if (!loading) {
      fetchMore({
        variables: {
          outcomesCursor: group?.outcomes?.pageInfo?.endCursor
        },
        updateQuery: (prevData, {fetchMoreResult}) => {
          // Reverse to uniq so it'll remove previous result if they appear
          // again in the load more
          // then reverse again to keep the order
          const edges = uniqBy(
            [...prevData.group.outcomes.edges, ...fetchMoreResult.group.outcomes.edges].reverse(),
            '_id'
          ).reverse()

          return {
            ...prevData,
            group: {
              ...prevData.group,
              outcomes: {
                ...prevData.group.outcomes,
                edges,
                pageInfo: fetchMoreResult.group.outcomes.pageInfo
              }
            }
          }
        }
      })
    }
  }

  const removeLearningOutcomes = (contentTagIds, allVars = true) => {
    const vars = allVars ? allVariables.current : [variables]

    vars.forEach(v => {
      const {group: g} = client.readQuery({
        query,
        variables: v
      })

      let removedCount = 0

      const newGroup = {
        ...g,
        outcomes: {
          ...g.outcomes,
          edges: g.outcomes.edges.filter(contentTag => {
            if (contentTagIds.includes(contentTag._id)) {
              removedCount += 1
              return false
            }
            return true
          })
        }
      }

      newGroup.outcomesCount -= removedCount

      client.writeQuery({
        query,
        variables: v,
        data: {
          group: newGroup
        }
      })
    })
  }

  const readLearningOutcomes = selectedIds => {
    return [...selectedIds]
      .map(linkId => {
        const link = client.readFragment({
          id: `ContentTag${linkId}`,
          fragment: gql`
            fragment LearningOutcomeFragment on ContentTag {
              _id
              canUnlink
              node {
                ... on LearningOutcome {
                  _id
                  description
                  title
                }
              }
              group {
                _id
                title
              }
            }
          `
        })
        return {
          linkId: link._id,
          _id: link.node._id,
          title: link.node.title,
          canUnlink: link.canUnlink,
          parentGroupId: link.group._id,
          parentGroupTitle: link.group.title
        }
      })
      .reduce((dict, link) => {
        dict[link.linkId] = link
        return dict
      }, {})
  }

  return {
    loading,
    group,
    error,
    loadMore,
    removeLearningOutcomes,
    readLearningOutcomes
  }
}

export default useGroupDetail
