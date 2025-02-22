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

import React from 'react'
import {createCache} from '@canvas/apollo'
import OutcomesContext from '@canvas/outcomes/react/contexts/OutcomesContext'
import {useManageOutcomes} from '../treeBrowser'
import {accountMocks} from '../../mocks/Management'
import {renderHook, act} from '@testing-library/react-hooks'
import {MockedProvider} from '@apollo/react-testing'

jest.useFakeTimers()

describe('useManageOutcomes', () => {
  let cache
  let mocks

  beforeEach(() => {
    cache = createCache()
    mocks = accountMocks()
  })

  const wrapper = ({children}) => (
    <OutcomesContext.Provider value={{env: {contextType: 'Account', contextId: '1'}}}>
      <MockedProvider cache={cache} mocks={mocks}>
        {children}
      </MockedProvider>
    </OutcomesContext.Provider>
  )

  test('it doesnt show deleted group after rerender', async () => {
    const {result} = renderHook(() => useManageOutcomes(), {wrapper})
    await act(async () => jest.runAllTimers())

    expect(result.current.collections['100']).toBeDefined()
    act(() => result.current.removeGroup('100'))
    expect(result.current.collections['100']).toBeUndefined()

    const {result: result2} = renderHook(() => useManageOutcomes(), {wrapper})
    await act(async () => jest.runAllTimers())
    expect(result2.current.collections['100']).toBeUndefined()
  })
})
