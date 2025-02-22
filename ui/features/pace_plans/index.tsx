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
import ReactDOM from 'react-dom'
import {Provider} from 'react-redux'
import k5Theme from '@canvas/k5/react/k5-theme'
import ready from '@instructure/ready'

import App from './react/app'
import reducers from './react/reducers/reducers'
import createStore from './react/shared/create_store'

k5Theme.use({fontOnly: true})

const CoursePage: React.FC = () => (
  <Provider store={createStore(reducers)}>
    <App />
  </Provider>
)

ready(() => {
  ReactDOM.render(<CoursePage />, document.getElementById('pace_plans'))
})
