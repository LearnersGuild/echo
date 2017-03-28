// import fetch from 'isomorphic-fetch'
//
// import config from 'src/config'
//
// if (!config.server.chat.baseURL) {
//   throw new Error('Chat base URL must be set in config')
// }
// //
// const queues = {
//   messageSent: 'chatMessageSent',
// }
//
// const paths = {
//   // channel is {id,name,members,topic,...}
//   '/api/channels.create'  {token, name} --> {ok, channel:{...}}
//   '/api/channels.setTopic'{token, channel, topic} --> {ok, topic}
//   '/api/channels.invite'  {token, channel, user} --> {ok, channel:{...}}
//   '/api/channels.join'    {token, name} --> {ok, channel:{...}}
//   '/api/channels.archive' {token, channel} --> {ok:true}
//   '/api/chat.postMessage' {token, channel, text} --> {ok, channel:"...", ts}
//   '/api/im.open'          {token, user} --> {ok, channel:{id}}
// }

export {default as createChannel} from './createChannel'

/**
 * NOTE: this service's functions are exported the way they are to enable
 * certain stubbing functionality functionality for testing that relies on the
 * way the module is cached and later required by dependent modules.
 */

export {default as createChannel} from './createChannel'
export {default as createChannelMessage} from './createChannelMessage'
export {default as createDirectMessage} from './createDirectMessage'
export {default as deleteChannel} from './deleteChannel'
export {default as joinChannel} from './joinChannel'
export {default as sendChannelMessage} from './sendChannelMessage'
export {default as sendDirectMessage} from './sendDirectMessage'
