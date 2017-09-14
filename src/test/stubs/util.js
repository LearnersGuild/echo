import {stub} from 'sinon'

export default function stubServiceAPIs(service, apis) {
  const enableOne = name => {
    stub(service, name, apis[name])
  }
  const enable = () => {
    Object.keys(apis).forEach(api => enableOne(api))
  }
  const disableOne = name => {
    service[name].restore()
  }
  const disable = () => {
    Object.keys(apis).forEach(api => disableOne(api))
  }
  return {
    enableOne,
    enable,
    disableOne,
    disable,
  }
}
