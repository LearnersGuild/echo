import yup from 'yup'
import {CYCLE_STATES} from 'src/common/models/cycle'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default yup.object().shape({
  id: yup.string().matches(UUID_REGEX),
  chapterId: yup.string().required().matches(UUID_REGEX),
  cycleNumber: yup.number().required().min(1),
  startTimestamp: yup.date().required(),
  state: yup.mixed().oneOf(CYCLE_STATES),
})
