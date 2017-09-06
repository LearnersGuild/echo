import yup from 'yup'

const userSchema = yup.object().shape({
  phaseNumber: yup.number().integer().positive().max(5).nullable(),
})

export default userSchema
