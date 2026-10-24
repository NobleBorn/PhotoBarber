import Image from "next/image";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { fromPercentCrop, toPercentCrop, type CropRegion, type ImageSize } from "@/lib/image/crop-geometry";

type Props = {
  image: ImageSize & { url: string; file: File };
  crop: CropRegion;
  aspect?: number;
  disabled: boolean;
  onChange: (crop: CropRegion) => void;
  onError: () => void;
};

export default function CropPreview({ image, crop, aspect, disabled, onChange, onError }: Props) {
  return (
    <div className="min-w-0 rounded-3xl border border-line bg-white p-4 sm:p-6">
      <div className="crop-preview overflow-hidden rounded-2xl bg-surface text-center leading-none">
        <ReactCrop crop={toPercentCrop(crop, image)} aspect={aspect} onChange={(_, percentage) => onChange(fromPercentCrop(percentage, image))} keepSelection ruleOfThirds disabled={disabled} className="align-middle" aria-label="Interactive image crop">
          <Image src={image.url} alt={`Crop preview of ${image.file.name}`} width={image.width} height={image.height} unoptimized draggable={false} onError={onError} className="h-auto max-h-[65vh] w-auto max-w-full object-contain" />
        </ReactCrop>
      </div>
      <p className="mt-4 truncate text-center text-sm text-muted">{image.file.name}</p>
      <p className="mt-1 text-center text-xs text-muted">Original: {image.width} × {image.height} px</p>
    </div>
  );
}
