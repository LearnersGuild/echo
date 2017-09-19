/* eslint-disable no-template-curly-in-string */
import yup from 'yup'
import moment from 'moment-timezone'

export default yup.object().shape({
  name: yup.string().required().min(3),
  channelName: yup.string().required().min(3),
  timezone: yup.string().required().test(
    'is-valid-timezone',
    '${path} is not a valid timezone',
    value => moment.tz.names().indexOf(value) >= 0,
  ),
})
