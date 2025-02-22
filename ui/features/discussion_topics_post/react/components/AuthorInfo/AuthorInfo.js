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

import I18n from 'i18n!discussion_posts'
import PropTypes from 'prop-types'
import React, {useContext, useMemo} from 'react'
import {resolveAuthorRoles, responsiveQuerySizes} from '../../utils'
import {RolePillContainer} from '../RolePillContainer/RolePillContainer'
import {SearchContext} from '../../utils/constants'
import {SearchSpan} from '../SearchSpan/SearchSpan'
import {User} from '../../../graphql/User'

import {Avatar} from '@instructure/ui-avatar'
import {Badge} from '@instructure/ui-badge'
import {Flex} from '@instructure/ui-flex'
import {Responsive} from '@instructure/ui-responsive'
import {ScreenReaderContent} from '@instructure/ui-a11y-content'
import {Text} from '@instructure/ui-text'
import {Tooltip} from '@instructure/ui-tooltip'

export const AuthorInfo = props => {
  const {searchTerm} = useContext(SearchContext)

  return (
    <Responsive
      match="media"
      query={responsiveQuerySizes({tablet: true, desktop: true})}
      props={{
        tablet: {
          authorNameTextSize: 'small',
          timestampTextSize: 'x-small',
          nameAndRoleDirection: 'column',
          badgeMarginLeft: '-16px'
        },
        desktop: {
          authorNameTextSize: 'medium',
          timestampTextSize: 'small',
          nameAndRoleDirection: 'row',
          badgeMarginLeft: '-24px'
        }
      }}
      render={responsiveProps => (
        <Flex>
          <Flex.Item align="start">
            {props.isUnread && (
              <div
                style={{
                  float: 'left',
                  marginLeft: responsiveProps.badgeMarginLeft,
                  marginTop: props.author ? '11px' : '2px'
                }}
                data-testid="is-unread"
                data-isforcedread={props.isForcedRead}
              >
                <Badge
                  type="notification"
                  placement="start center"
                  standalone
                  formatOutput={() => (
                    <ScreenReaderContent>{I18n.t('Unread post')}</ScreenReaderContent>
                  )}
                />
              </div>
            )}
            {props.author && (
              <Avatar
                name={props.author.displayName}
                src={props.author.avatarUrl}
                margin="0"
                data-testid="author_avatar"
              />
            )}
          </Flex.Item>
          <Flex.Item shouldShrink>
            <Flex direction="column" margin="0 0 0 small">
              {props.author && (
                <Flex.Item>
                  <Flex direction={responsiveProps.nameAndRoleDirection}>
                    <Flex.Item padding="0 small 0 0">
                      <Text
                        weight="bold"
                        size={responsiveProps.authorNameTextSize}
                        lineHeight="condensed"
                        data-testid="author_name"
                      >
                        <SearchSpan
                          isIsolatedView={props.isIsolatedView}
                          searchTerm={searchTerm}
                          text={props.author.displayName}
                        />
                      </Text>
                    </Flex.Item>
                    <Flex.Item overflowY="hidden">
                      <RolePillContainer
                        discussionRoles={resolveAuthorRoles(
                          props.isTopicAuthor,
                          props.author.courseRoles
                        )}
                        data-testid="pill-container"
                      />
                    </Flex.Item>
                  </Flex>
                </Flex.Item>
              )}
              <Flex.Item overflowX="hidden">
                <Timestamps
                  author={props.author}
                  editor={props.editor}
                  timingDisplay={props.timingDisplay}
                  editedTimingDisplay={props.editedTimingDisplay}
                  lastReplyAtDisplay={props.lastReplyAtDisplay}
                  showCreatedAsTooltip={props.showCreatedAsTooltip}
                  timestampTextSize={responsiveProps.timestampTextSize}
                />
              </Flex.Item>
            </Flex>
          </Flex.Item>
        </Flex>
      )}
    />
  )
}

AuthorInfo.propTypes = {
  /**
   * Object containing author information
   */
  author: User.shape,
  /**
   * Object containing editor information
   */
  editor: User.shape,
  /**
   * Determines if the unread badge should be displayed
   */
  isUnread: PropTypes.bool,
  /**
   * Marks whether an unread message has a forcedReadState
   */
  isForcedRead: PropTypes.bool,
  /**
   * Boolean to determine if we are in the isolated view
   */
  isIsolatedView: PropTypes.bool,
  /**
   * Display text for the relative time information. This prop is expected
   * to be provided as a string of the exact text to be displayed, not a
   * timestamp to be formatted.
   */
  timingDisplay: PropTypes.string,
  /**
   * Denotes time of last edit.
   * Display text for the relative time information. This prop is expected
   * to be provided as a string of the exact text to be displayed, not a
   * timestamp to be formatted.
   */
  editedTimingDisplay: PropTypes.string,
  /**
   * Last Reply Date if there are discussion replies
   */
  lastReplyAtDisplay: PropTypes.string,
  /**
   * Whether or not we render the created at date in a tooltip
   */
  showCreatedAsTooltip: PropTypes.bool,
  /**
   * Boolean to determine if the author is the topic author
   */
  isTopicAuthor: PropTypes.bool
}

const Timestamps = props => {
  const editText = useMemo(() => {
    if (!props.editedTimingDisplay || props.editedTimingDisplay === props.timingDisplay) {
      return null
    }

    if (props.editor && props.editor?._id !== props.author?._id) {
      return I18n.t('Edited by %{editorName} %{editedTimingDisplay}', {
        editorName: props.editor.displayName,
        editedTimingDisplay: props.editedTimingDisplay
      })
    } else {
      return I18n.t('Edited %{editedTimingDisplay}', {
        editedTimingDisplay: props.editedTimingDisplay
      })
    }
  }, [props.editedTimingDisplay, props.timingDisplay, props.editor, props.author])

  return (
    <Flex wrap="wrap">
      {(!props.showCreatedAsTooltip || !editText) && (
        <Flex.Item overflowX="hidden" padding="0 xx-small 0 0">
          <Text size={props.timestampTextSize}>{props.timingDisplay}</Text>
        </Flex.Item>
      )}
      {editText && props.showCreatedAsTooltip && (
        <Flex.Item data-testid="created-tooltip" overflowX="hidden" padding="0 xx-small 0 0">
          <Tooltip
            renderTip={I18n.t('Created %{timingDisplay}', {timingDisplay: props.timingDisplay})}
          >
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
            <span tabIndex="0">
              <Text size={props.timestampTextSize}>{editText}</Text>
            </span>
          </Tooltip>
        </Flex.Item>
      )}
      {editText && !props.showCreatedAsTooltip && (
        <Flex.Item overflowX="hidden" padding="0 xx-small 0 0">
          <Text size={props.timestampTextSize}>{editText}</Text>
        </Flex.Item>
      )}
      {props.lastReplyAtDisplay && (
        <Flex.Item overflowX="hidden">
          <Text size={props.timestampTextSize}>
            {I18n.t('Last reply %{lastReplyAtDisplay}', {
              lastReplyAtDisplay: props.lastReplyAtDisplay
            })}
          </Text>
        </Flex.Item>
      )}
    </Flex>
  )
}

Timestamps.propTypes = {
  author: User.shape,
  editor: User.shape,
  timingDisplay: PropTypes.string,
  editedTimingDisplay: PropTypes.string,
  lastReplyAtDisplay: PropTypes.string,
  showCreatedAsTooltip: PropTypes.bool,
  timestampTextSize: PropTypes.string
}
