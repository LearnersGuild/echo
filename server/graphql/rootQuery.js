import {GraphQLObjectType} from 'graphql'
import {instrumentResolvers} from './util'

import rootFields from './queries'

export default new GraphQLObjectType({
  name: 'RootQuery',
  fields: instrumentResolvers(rootFields, 'query')
})
