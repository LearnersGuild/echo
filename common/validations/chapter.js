/* eslint-disable no-template-curly-in-string */
import yup from 'yup'
import moment from 'moment-timezone'
import juration from 'juration'

export const chapterSchema = yup.object().shape({
  name: yup.string().required().min(3),
  channelName: yup.string().required().min(3),
  timezone: yup.string().required().test(
    'is-valid-timezone',
    '${path} is not a valid timezone',
    value => moment.tz.names().indexOf(value) >= 0,
  ),
  goalRepositoryURL: yup.string().required().matches(/https?:\/\/github\.com\/.+\/.+/, '${path} must be a valid GitHub repository URL'),
  cycleDuration: yup.string().required().test(
    'is-valid-duration',
    '${path} is not a valid duration',
    function (value) {
      let durationSecs
      try {
        durationSecs = juration.parse(value)
      } catch (err) {
        throw this.createError()
      }
      if (durationSecs < 300) {
        throw this.createError({message: '${path} must be at least 5 minutes long'})
      }
      return true
    }
  ),
})
