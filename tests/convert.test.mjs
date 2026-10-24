import assert from "node:assert/strict";
import test from "node:test";
import { decodeImage } from "../src/lib/image/decode.ts";
import { availableConversionFormats, convertedFilename, convertImage } from "../src/lib/image/convert.ts";
const source={width:1200,height:800};
const defaults={format:"jpg",quality:75,background:"#ffffff"};

test("filename replacement preserves the full basename and changes only the last extension",()=>{
 assert.equal(convertedFilename("My.Photo.JpEg","webp"),"My.Photo.webp");
 assert.equal(convertedFilename("photo","png"),"photo.png");
 assert.equal(convertedFilename(".hidden","jpg"),".hidden.jpg");
 assert.equal(convertedFilename("photo.","png"),"photo.png");
 assert.equal(convertedFilename("photo.png","png"),"photo.png");
 assert.throws(()=>convertedFilename("photo.png","tiff"),/supported/);
});

globalThis.document={createElement(){throw new Error("Unexpected canvas")}};
globalThis.createImageBitmap=async()=>{throw new Error("Unexpected decode")};
function mockCanvas(t,returnedType){
 const calls=[];
 const context={fillStyle:"",fillRect(...args){calls.push(["fill",this.fillStyle,...args])},drawImage(...args){calls.push(["draw",...args])}};
 const canvas={width:0,height:0,getContext:()=>context,toBlob(callback,type,quality){calls.push(["encode",type,quality]);callback(new Blob(["output"],{type:returnedType??type}))}};
 t.mock.method(document,"createElement",()=>canvas);
 return{canvas,calls};
}
for(const [format,mime]of [["jpg","image/jpeg"],["png","image/png"],["webp","image/webp"]])test(`converts at unchanged dimensions to ${mime}`,async(t)=>{
 const {canvas,calls}=mockCanvas(t);
 const result=await convertImage(source,"Original.Photo.PNG",{...defaults,format});
 assert.equal(result.blob.type,mime);assert.equal(result.filename,`Original.Photo.${format}`);assert.equal(result.width,1200);assert.equal(result.height,800);
 assert.deepEqual(calls.find(call=>call[0]==="encode"),["encode",mime,format==="png"?undefined:0.75]);
 assert.equal(calls.some(call=>call[0]==="fill"),format==="jpg");
 assert.equal(canvas.width,0);assert.equal(canvas.height,0);assert.deepEqual(source,{width:1200,height:800});
});

test("JPEG composites the selected background before drawing source pixels",async(t)=>{
 const {calls}=mockCanvas(t);await convertImage(source,"image.png",{...defaults,background:"#164d3b"});
 assert.deepEqual(calls[0],["fill","#164d3b",0,0,1200,800]);assert.deepEqual(calls[1],["draw",source,0,0]);
});

test("browser fallback and failed encoding are rejected and the buffer is released",async(t)=>{
 const {canvas}=mockCanvas(t,"image/png");await assert.rejects(convertImage(source,"image.png",{...defaults,format:"webp"}),/requested format/);assert.equal(canvas.width,0);
 canvas.toBlob=cb=>cb(null);await assert.rejects(convertImage(source,"image.png",defaults),/encoding failed/);assert.equal(canvas.height,0);
});

test("codec detection does not advertise unsupported encoders",async(t)=>{
 const {canvas}=mockCanvas(t);canvas.toBlob=(callback,type)=>callback(new Blob(["data"],{type:type==="image/webp"?"image/png":type}));
 assert.deepEqual(await availableConversionFormats(),["jpg","png"]);assert.equal(canvas.width,0);
});

test("invalid options and dimensions fail before allocating large canvases",async()=>{
 for(const value of [{format:"tiff"},{quality:0},{quality:101},{quality:NaN},{background:"red"}])await assert.rejects(convertImage(source,"image.png",{...defaults,...value}));
 await assert.rejects(convertImage({width:0,height:800},"image.png",defaults),/dimensions/);
});

test("EXIF orientation is applied once to the reusable source bitmap",async(t)=>{
 let options;t.mock.method(globalThis,"createImageBitmap",async(_,opts)=>{options=opts;return source});
 assert.equal((await decodeImage(new File([new Uint8Array([255,216,255,0])],"photo.jpg",{type:"image/jpeg"}))).bitmap,source);assert.deepEqual(options,{imageOrientation:"from-image"});
 await assert.rejects(decodeImage(new File(["input"],"photo.gif",{type:"image/gif"})),/Unsupported/);
});

test("AVIF output is enabled only after valid signature and encode/decode validation",async(t)=>{
 const {canvas}=mockCanvas(t);
 const ftyp=Buffer.alloc(24);ftyp.writeUInt32BE(24);ftyp.write("ftyp",4);ftyp.write("avif",8);ftyp.write("avif",16);ftyp.write("mif1",20);
 canvas.toBlob=(cb,type)=>cb(new Blob([type==="image/avif"?ftyp:Buffer.from("encoded")],{type}));
 let closed=false;t.mock.method(globalThis,"createImageBitmap",async()=>({width:1,height:1,close(){closed=true}}));
 assert.deepEqual(await availableConversionFormats(),["jpg","png","webp","avif"]);assert.equal(closed,true);
 assert.equal(convertedFilename("Photo.HEIC","avif"),"Photo.avif");
 canvas.toBlob=(cb,type)=>cb(new Blob(["not-avif"],{type}));
 await assert.rejects(convertImage(source,"Photo.png",{...defaults,format:"avif"}),/valid AVIF/);
});
