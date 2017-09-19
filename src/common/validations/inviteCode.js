/* eslint-disable no-template-curly-in-string */
import yup from 'yup'

import {USER_ROLES} from 'src/common/models/user'

const invalidRoleMessage = `\${path} must be one of the following values: ${USER_ROLES.join(', ')}`

export default yup.object().shape({
  code: yup.string().required().min(6),
  description: yup.string().required().min(6),
  roles: yup.mixed().test(
    'roles-are-valid',
    invalidRoleMessage,
    function (roles) {
      roles.forEach(role => {
        if (USER_ROLES.indexOf(role) < 0) {
          throw this.createError({message: invalidRoleMessage})
        }
      })
      return true
    }
  )
})
