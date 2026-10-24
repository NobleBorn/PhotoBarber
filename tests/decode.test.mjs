import assert from "node:assert/strict";
import test from "node:test";
import { inspectImage } from "../src/lib/image/detect-format.ts";
import { decodeImage } from "../src/lib/image/decode.ts";
import { tiffOrientationMatrix } from "../src/lib/image/tiff-orientation.ts";
const buffer=(bytes)=>new Uint8Array(bytes).buffer;
function box(type,data){const result=Buffer.alloc(8+data.length);result.writeUInt32BE(result.length);result.write(type,4);data.copy(result,8);return result;}
function ftyp(brands){return box("ftyp",Buffer.concat([Buffer.from(brands[0]),Buffer.alloc(4),...brands.slice(1).map(v=>Buffer.from(v))]));}
const ab=(data)=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);

test("signature detection recognizes all input families without extensions or supplied MIME",()=>{
 const cases=[[[255,216,255,0],"jpg"],[[137,80,78,71,13,10,26,10],"png"],[[73,73,42,0,8,0,0,0],"tiff"],[[77,77,0,42,0,0,0,8],"tiff"]];
 for(const [bytes,expected]of cases)assert.equal(inspectImage(buffer(bytes)).format,expected);
 const bmp=Buffer.alloc(26);bmp.write("BM");assert.equal(inspectImage(ab(bmp)).format,"bmp");
 const webp=Buffer.alloc(12);webp.write("RIFF");webp.write("WEBP",8);assert.equal(inspectImage(ab(webp)).format,"webp");
 for(const [brands,expected]of [[["mif1","avif"],"avif"],[["heic","mif1"],"heic"],[["mif1"],"heif"]])assert.equal(inspectImage(ab(ftyp(brands))).format,expected);
 assert.throws(()=>inspectImage(buffer([1,2,3,4])),/unrecognized/);
 assert.throws(()=>inspectImage(buffer([73,73,43,0,8,0,0,0])),/BigTIFF/);
});

test("frame detection walks PNG and WebP chunks rather than image payload text",()=>{
 const actl=Buffer.alloc(20);actl.writeUInt32BE(8);actl.write("acTL",4);actl.writeUInt32BE(3,8);
 const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),actl]);assert.equal(inspectImage(ab(png)).frameCount,3);
 const riff=Buffer.alloc(12);riff.write("RIFF");riff.write("WEBP",8);const chunk=(name)=>{const b=Buffer.alloc(8);b.write(name);return b};
 const info=inspectImage(ab(Buffer.concat([riff,chunk("ANIM"),chunk("ANMF"),chunk("ANMF")])));assert.equal(info.multiFrame,true);assert.equal(info.frameCount,2);
});

test("GIF counts actual image descriptors and skips extensions and compressed blocks",()=>{
 const header=Buffer.from([71,73,70,56,57,97,1,0,1,0,0,0,0]);
 const frame=Buffer.from([0x2c,0,0,0,0,1,0,1,0,0,2,2,0x2c,0x21,0]);
 const gif=Buffer.concat([header,Buffer.from([0x21,0xfe,2,0x2c,0x2c,0]),frame,frame,Buffer.from([0x3b])]);
 const info=inspectImage(ab(gif));assert.equal(info.format,"gif");assert.equal(info.frameCount,2);assert.equal(info.multiFrame,true);
});

test("HEIF image collections and AVIF sequence brands are detected",()=>{
 const entry=(hidden)=>box("infe",Buffer.from([2,0,0,hidden?1:0,0,1,0,0,...Buffer.from("hvc1"),0]));
 const iinf=box("iinf",Buffer.concat([Buffer.from([0,0,0,0,0,3]),entry(false),entry(false),entry(true)]));
 const info=inspectImage(ab(Buffer.concat([ftyp(["heic"]),box("meta",Buffer.concat([Buffer.alloc(4),iinf]))])));
 assert.equal(info.imageItemCount,2);assert.equal(info.multiFrame,true);
 assert.equal(inspectImage(ab(ftyp(["avis","avif"]))).multiFrame,true);
});

test("all TIFF orientation matrices map image corners inside the normalized dimensions",()=>{
 for(let orientation=1;orientation<=8;orientation++){
  const value=tiffOrientationMatrix(120,80,orientation);assert.equal(value.width,orientation>=5?80:120);assert.equal(value.height,orientation>=5?120:80);
  const [a,b,c,d,e,f]=value.matrix;for(const x of [0,120])for(const y of [0,80]){const xx=a*x+c*y+e,yy=b*x+d*y+f;assert.ok(xx>=0&&xx<=value.width);assert.ok(yy>=0&&yy<=value.height)}
 }
});

globalThis.createImageBitmap=async()=>{throw new Error("Unexpected decode")};
test("decode uses detected contents even when filename and MIME are wrong",async(t)=>{
 let type,options;t.mock.method(globalThis,"createImageBitmap",async(blob,opts)=>{type=blob.type;options=opts;return{width:10,height:20,close(){}}});
 const image=await decodeImage(new File([buffer([255,216,255,0])],"wrong.png",{type:"image/png"}));assert.equal(image.mimeType,"image/jpeg");assert.equal(type,"image/jpeg");assert.deepEqual(options,{imageOrientation:"from-image"});
});

test("unavailable native codec fails clearly and cancellation closes late bitmaps",async(t)=>{
 t.mock.method(globalThis,"createImageBitmap",async()=>{throw new Error("Codec unavailable")});
 await assert.rejects(decodeImage(new Blob([ftyp(["avif"])])),/cannot decode.*AVIF/);
 let closed=false;const abort=new AbortController();t.mock.method(globalThis,"createImageBitmap",async()=>{abort.abort();return{width:10,height:20,close(){closed=true}}});
 await assert.rejects(decodeImage(new Blob([buffer([255,216,255])]),abort.signal),{name:"AbortError"});assert.equal(closed,true);
});
