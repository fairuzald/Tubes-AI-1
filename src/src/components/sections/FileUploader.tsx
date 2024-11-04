import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FileUploaderProps {
  onFileChange: (file: File | null) => void;
  onLoad: () => void;
  fileData: File | null;
  isLoading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const FileUploader = ({
  onFileChange,
  onLoad,
  fileData,
  isLoading,
  fileInputRef,
}: FileUploaderProps) => (
  <div className="flex flex-col items-center gap-2">
    <label className="font-bold">Load CSV File</label>
    <Input
      type="file"
      accept=".csv"
      onChange={(e) => onFileChange(e.target.files?.[0] || null)}
      ref={fileInputRef}
      className="border p-2 rounded"
    />
    <Button disabled={!fileData || isLoading} onClick={onLoad}>
      Load
    </Button>
  </div>
);
