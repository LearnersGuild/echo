export default function findProjectsWithWorkPlans() {
  return {
    query: `
      query {
        findProjectsWithWorkPlans {
          id,
          name
        },
      }
    `,
  }
}
