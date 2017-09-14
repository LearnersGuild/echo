import useFixture from 'src/test/helpers/fixtures'

console.log('~~~> useFixture', useFixture)

const theImports = Object.assign({},
  require('./graphql'),
  require('./expectations'),
  require('./idmMocks'),
)

export theImports
export * from './db'