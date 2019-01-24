import test from 'ava';

import { ConsulReader } from './consul'


test('Given a consul server that is probably not reachable where you are', async (t) => {
    const serverUrl = 'http://consul.internal.unity3d.com'
    const server = new ConsulReader('yamato/test', serverUrl, 'aeuw1')
    //console.log((await server.Read())["yamato/test/workreceiver/POSTGRES_CONNECTION_STRING"])
    t.pass()
})