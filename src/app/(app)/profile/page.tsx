import { Card } from "@/components/ui/card";
import { requireAppUser } from "@/modules/users/app-user";
import { ProfileActions } from "./profile-actions";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireAppUser();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="display-xl">Profile</h1>
      <Card className="p-6">
        <p className="text-lg font-semibold">{user.name}</p>
        <p className="text-muted-foreground">{user.email}</p>
      </Card>
      <ProfileActions />
    </div>
  );
}
