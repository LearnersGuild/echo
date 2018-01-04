export default function findPhases() {
  return {
    variables: {},
    query: `
      query {
        findPhases {
          id
          number
          name
        }
      }
    `,
  }
}
