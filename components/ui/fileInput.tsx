import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FileInput() {
  return (
    <div className="grid w-full max-w-sm items-center gap-3">
      <Label htmlFor="csv">Upload CSV Here (the messier the better)</Label>
      <Input id="picture" type="file" />
    </div>
  );
}
