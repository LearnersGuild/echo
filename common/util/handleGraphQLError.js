export default function handleGraphQLError(err, {throwErrors}) {
  if (err && err.errors && err.errors.length > 0) {
    if (throwErrors) {
      throw new Error(err.errors[0].message)
    }
  }
  console.error('GraphQL ERROR:', err)
}
