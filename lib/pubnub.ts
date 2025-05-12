// pubnub.js
import PubNub from 'pubnub';

const publishKey = process.env.NEXT_PUBLIC_PUBNUB_PUBLISH_KEY;
const subscribeKey = process.env.NEXT_PUBLIC_PUBNUB_SUBSCRIBE_KEY;

if (!publishKey || !subscribeKey) {
  throw new Error('PubNub keys are not defined in environment variables');
}

const pubnub = new PubNub({
  publishKey,
  subscribeKey,
  uuid: "NetlineClientIDWeb"
});

export default pubnub;
