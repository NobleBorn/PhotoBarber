import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPayload, initialFields, escapeWifi, validateColors } from '../src/lib/qr/payload.ts';
test('URL and text preserve intended data and reject unsafe URLs', () => {
 assert.equal(buildPayload(initialFields), 'https://photobarber.com');
 assert.equal(buildPayload({...initialFields,type:'text',value:'こんにちは 🌲\ntext'}),'こんにちは 🌲\ntext');
 for(const value of ['javascript:alert(1)','example.com','']) assert.throws(()=>buildPayload({...initialFields,value}));
});
test('Wi-Fi escapes scanner delimiters and omits open-network passwords', () => {
 assert.equal(escapeWifi('a\\b;c:d,e"f'), 'a\\\\b\\;c\\:d\\,e\\"f');
 assert.equal(buildPayload({...initialFields,type:'wifi',ssid:'Cafe;A',password:'a:b',hidden:true}), 'WIFI:T:WPA;S:Cafe\\;A;P:a\\:b;H:true;;');
 assert.equal(buildPayload({...initialFields,type:'wifi',ssid:'Open',encryption:'nopass',password:'secret'}),'WIFI:T:nopass;S:Open;P:;H:false;;');
 assert.throws(()=>buildPayload({...initialFields,type:'wifi',ssid:'Private'}));
});
test('email headers and phone numbers cannot inject payload delimiters', () => {
 assert.equal(buildPayload({...initialFields,type:'email',value:'a+b@example.com',subject:'Hello & café',body:'line1\nline2'}),'mailto:a%2Bb@example.com?subject=Hello%20%26%20caf%C3%A9&body=line1%0Aline2');
 assert.equal(buildPayload({...initialFields,type:'email',value:'a@example.com'}),'mailto:a@example.com');
 assert.throws(()=>buildPayload({...initialFields,type:'email',value:'a@example.com?body=bad'}));
 assert.equal(buildPayload({...initialFields,type:'phone',value:'+1 (212) 555-1234'}),'tel:+12125551234');
 assert.throws(()=>buildPayload({...initialFields,type:'phone',value:'123;bad'}));
});
test('low contrast and inverted colors are rejected', () => {
 assert.doesNotThrow(()=>validateColors('#164d3b','#ffffff'));
 assert.throws(()=>validateColors('#eeeeee','#ffffff'));
 assert.throws(()=>validateColors('#ffffff','#000000'));
});
