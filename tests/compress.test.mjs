import assert from "node:assert/strict";
import test from "node:test";
import UPNG from "upng-js";
import { crc32, deflateSync } from "node:zlib";
import { chooseCompression, targetSizeInBytes, validateCompressionOptions } from "../src/lib/image/compression-search.ts";
import { compressImage, encodePng, validateCompressionFile } from "../src/lib/image/compress.ts";
const blob = (size, type = "image/jpeg") => new Blob([new Uint8Array(size)], { type });

test("automatic selects format-aware defaults and manual respects quality", async () => {
 for (const [type, expected] of [["image/jpeg",82],["image/webp",80],["image/png",100]]) {
  let q;
  const result = await chooseCompression(blob(1000,type), { mode:"automatic", quality:50 }, async(quality)=>{q=quality;return blob(500,type)});
  assert.equal(q,expected);assert.equal(result.blob.size,500);assert.equal(result.usedOriginal,false);
 }
 let chosen;await chooseCompression(blob(1000),{mode:"manual",quality:37},async(q)=>{chosen=q;return blob(500)});assert.equal(chosen,37);
});

test("larger or equal output offers the unchanged original", async () => {
 for (const size of [1000,1200]) {
  const original=blob(1000);const result=await chooseCompression(original,{mode:"manual",quality:80},async()=>blob(size));
  assert.equal(result.blob,original);assert.equal(result.usedOriginal,true);
 }
});

test("target search finds the highest tested quality below the requested bytes", async () => {
 const result=await chooseCompression(blob(5000),{mode:"target",quality:80,targetBytes:650},async(q)=>blob(100+q*10));
 assert.equal(result.targetMet,true);assert.equal(result.quality,55);assert.equal(result.blob.size,650);assert.ok(result.attempts<=9);
});

test("unreachable target returns smallest found and accurately reports failure", async () => {
 const result=await chooseCompression(blob(2000),{mode:"target",quality:80,targetBytes:50},async(q)=>blob(100+q));
 assert.equal(result.targetMet,false);assert.equal(result.blob.size,101);assert.equal(result.quality,1);
});

test("original already under target avoids unnecessary re-encoding",async()=>{
 let calls=0;const original=blob(100);const result=await chooseCompression(original,{mode:"target",quality:80,targetBytes:101},async()=>{calls++;return blob(90)});
 assert.equal(calls,0);assert.equal(result.blob,original);assert.equal(result.targetMet,true);
});

test("MIME fallback and invalid settings are rejected",async()=>{
 await assert.rejects(chooseCompression(blob(1000),{mode:"manual",quality:80},async()=>blob(100,"image/png")),/different image format/);
 for(const quality of [0,101,NaN,1.5])assert.throws(()=>validateCompressionOptions({mode:"manual",quality}));
 assert.throws(()=>validateCompressionOptions({mode:"target",quality:80,targetBytes:0}));
 for(const invalid of ["","0","-1","NaN","Infinity","1e99"])assert.equal(targetSizeInBytes(invalid,"KB"),null);
 assert.equal(targetSizeInBytes("1.5","MB"),1572864);
});

function pixels(width,height) {
 const rgba=new Uint8Array(width*height*4);
 for(let i=0;i<rgba.length;i+=4){rgba[i]=(i*13)%256;rgba[i+1]=(i*7)%256;rgba[i+2]=(i*3)%256;rgba[i+3]=(i/4)%256}
 return rgba;
}
test("real PNG optimization preserves dimensions and every alpha value at all qualities",async()=>{
 const rgba=pixels(32,24);const original=new Uint8Array(rgba);
 for(const quality of [1,50,99,100]) {
  const result=encodePng(rgba.buffer,32,24,quality);const decoded=UPNG.decode(await result.arrayBuffer());const output=new Uint8Array(UPNG.toRGBA8(decoded)[0]);
  assert.equal(result.type,"image/png");assert.equal(decoded.width,32);assert.equal(decoded.height,24);
  for(let i=3;i<rgba.length;i+=4)assert.equal(output[i],rgba[i]);
  if(quality===100)assert.deepEqual(output,rgba);
 }
 assert.deepEqual(rgba,original);
});

test("real PNG automatic compression is no larger and remains a PNG",async()=>{
 const rgba=pixels(32,24);const file=new File([UPNG.encode([rgba.buffer],32,24,0)],"Original.Photo.PNG",{type:"image/png"});
 const result=await compressImage(file,{mode:"automatic",quality:80});
 assert.ok(result.blob.size<=file.size);assert.equal(result.blob.type,file.type);assert.equal(result.width,32);assert.equal(result.height,24);
});

globalThis.createImageBitmap=async()=>{throw new Error("Unexpected decode")};
globalThis.OffscreenCanvas=class {constructor(){throw new Error("Unexpected canvas")}};
test("JPEG and WebP use the original canvas dimensions and exact requested MIME/quality",async(t)=>{
 for(const type of ["image/jpeg","image/webp"]){
  let closed=false,canvas,args;
  t.mock.method(globalThis,"createImageBitmap",async()=>({width:1200,height:800,close(){closed=true}}));
  t.mock.method(globalThis,"OffscreenCanvas",function(width,height){canvas={width,height,getContext:()=>({drawImage(){}}),async convertToBlob(options){args=options;return blob(200,type)}};return canvas});
  const bytes=new Uint8Array(2000);if(type==="image/jpeg"){bytes[0]=255;bytes[1]=216;}else{bytes.set(new TextEncoder().encode("RIFF"),0);bytes.set(new TextEncoder().encode("WEBP"),8);}
  const result=await compressImage(new File([bytes],"photo.jpg",{type}),{mode:"manual",quality:63});
  assert.equal(result.width,1200);assert.equal(result.height,800);assert.deepEqual(args,{type,quality:0.63});assert.equal(closed,true);assert.equal(canvas.width,0);
 }
});

test("animated or 16-bit PNGs are retained unchanged instead of discarding frames/depth",async()=>{
 const rgba=pixels(2,2);const animated=UPNG.encode([rgba.buffer,rgba.slice().buffer],2,2,0,[100,100]);
 const file=new File([animated],"animation.png",{type:"image/png"});const result=await compressImage(file,{mode:"target",quality:80,targetBytes:1});
 assert.equal(result.usedOriginal,true);assert.equal(result.blob,file);assert.equal(result.targetMet,false);assert.match(result.note,/preserve/);
});

function pngChunk(type, data) {
 const body=Buffer.concat([Buffer.from(type),data]), header=Buffer.alloc(4), crc=Buffer.alloc(4);header.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(body));return Buffer.concat([header,body,crc]);
}
test("16-bit and color-profile PNG originals are kept without losing depth or color interpretation",async()=>{
 const header=Buffer.alloc(13);header.writeUInt32BE(1,0);header.writeUInt32BE(1,4);header[8]=16;header[9]=6;
 const sixteen=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),pngChunk("IHDR",header),pngChunk("IDAT",deflateSync(Buffer.from([0,255,255,0,0,0,0,255,255]))),pngChunk("IEND",Buffer.alloc(0))]);
 const rgba=pixels(2,2), ordinary=Buffer.from(UPNG.encode([rgba.buffer],2,2,0));const gamma=Buffer.alloc(4);gamma.writeUInt32BE(45455);
 const profiled=Buffer.concat([ordinary.subarray(0,33),pngChunk("gAMA",gamma),ordinary.subarray(33)]);
 for(const buffer of [sixteen,profiled]){const file=new File([buffer],"original.png",{type:"image/png"});const result=await compressImage(file,{mode:"automatic",quality:80});assert.equal(result.blob,file);assert.equal(result.usedOriginal,true);}
});
test("mislabeled input formats are rejected before encoding",async()=>{
 await assert.rejects(validateCompressionFile(new File(["GIF89a"],"fake.jpg",{type:"image/jpeg"})),/contents do not match/);
});
