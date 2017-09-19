import yup from 'yup'

export default yup.object().shape({
  phaseNumber: yup.number().integer().positive().max(5).nullable(),
})
