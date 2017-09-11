import yup from 'yup'

export const userSchema = yup.object().shape({
  phaseNumber: yup.number().integer().positive().max(5).nullable(),
})

