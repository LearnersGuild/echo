import {graphql, GraphQLString, GraphQLSchema, GraphQLObjectType} from 'graphql'

const noopQuery = new GraphQLObjectType({name: 'Query', fields: () => ({
  noop: {
    type: GraphQLString,
    resolve: () => null,
  }
})})

function runGraphQL(schema, graphqlQueryString, rootQuery, args) {
  return graphql(schema, graphqlQueryString, rootQuery, args)
    .then(result => {
      if (result.errors) {
        throw new Error(result.errors.map(err => err.message).join('\n'))
      }
      return result
    })
}

export function runGraphQLQuery(graphqlQueryString, fields, args = undefined, rootQuery = {currentUser: true}) {
  const query = new GraphQLObjectType({name: 'Query', fields})
  const schema = new GraphQLSchema({query})

  return runGraphQL(schema, graphqlQueryString, rootQuery, args)
}

export function runGraphQLMutation(graphqlQueryString, fields, args = undefined, rootQuery = {currentUser: true}) {
  const mutation = new GraphQLObjectType({name: 'Mutation', fields})
  const schema = new GraphQLSchema({
    query: noopQuery, // GraphQL really wants you to have a query, even if it's not used
    mutation
  })

  return runGraphQL(schema, graphqlQueryString, rootQuery, args)
}
