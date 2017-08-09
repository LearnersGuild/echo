import yup from 'yup'

export const memberSchema = yup.object().shape({
  phaseNumber: yup.number().integer().positive().max(5).nullable(),
})
