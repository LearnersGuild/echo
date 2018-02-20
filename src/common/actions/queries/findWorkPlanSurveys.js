export default function findWorkPlanSurveys() {
  return {
    query: `
      query {
        findWorkPlanSurveys {
          id,
          name
        },
      }
    `,
  }
}
