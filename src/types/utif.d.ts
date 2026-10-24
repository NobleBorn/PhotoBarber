declare module "utif" {
  export type IFD = { width?: number; height?: number; [tag: `t${number}`]: number[] | undefined };
  const UTIF: { decode(buffer: ArrayBuffer): IFD[]; decodeImage(buffer: ArrayBuffer, ifd: IFD, ifds?: IFD[]): void; toRGBA8(ifd: IFD): Uint8Array; };
  export default UTIF;
}
