import { useState } from "react";
import { useProfileNotification } from "@/contexts/ProfileNotificationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { User } from "lucide-react";

export function ProfilePanel() {
  const { profile, setProfile } = useProfileNotification();
  const [form, setForm] = useState(profile);

  const handleSave = () => {
    setProfile(form);
    toast.success("Profil enregistré !");
  };

  return (
    <div className="flex flex-col gap-6 p-1">
      <SheetHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <SheetTitle>Mon profil</SheetTitle>
            <SheetDescription>Vos informations personnelles</SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="prenom">Prénom</Label>
          <Input id="prenom" placeholder="Votre prénom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="age">Âge</Label>
          <Input id="age" type="number" placeholder="Ex : 45" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="poids">Poids (kg)</Label>
          <Input id="poids" type="number" placeholder="Ex : 70" value={form.poids} onChange={(e) => setForm({ ...form, poids: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label>Genre</Label>
          <Select value={form.genre} onValueChange={(v) => setForm({ ...form, genre: v as any })}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="homme">Homme</SelectItem>
              <SelectItem value="femme">Femme</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSave} className="mt-2 h-11 rounded-xl">
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
