// @ts-check

import { escapace, compose } from 'eslint-config-escapace'

export default compose(escapace(), {
  files: ['**/molecule.yml'],
  rules: {
    'yaml/file-extension': 'off',
  },
})
