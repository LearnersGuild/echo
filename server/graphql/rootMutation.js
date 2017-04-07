import {GraphQLObjectType} from 'graphql'
import {instrumentResolvers} from './util'

import rootFields from './mutations'

export default new GraphQLObjectType({
  name: 'RootMutation',
  fields: instrumentResolvers(rootFields, 'mutation')
})
