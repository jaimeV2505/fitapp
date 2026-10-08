import { Card } from "@/components/ui/card";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { titleOf } from "@/lib/i18n/metadata";
import { getT } from "@/lib/i18n/server";
import { requireAppUser } from "@/modules/users/app-user";
import { ProfileActions } from "./profile-actions";

export const generateMetadata = titleOf("profile.title");

export default async function ProfilePage() {
  const user = await requireAppUser();
  const t = await getT();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="display-xl">{t("profile.title")}</h1>
      <Card className="p-6">
        <p className="text-lg font-semibold">{user.name}</p>
        <p className="text-muted-foreground">{user.email}</p>
      </Card>
      <Card className="p-6">
        <p className="mb-3 font-semibold">{t("common.language")}</p>
        <LocaleSwitcher />
      </Card>
      <ProfileActions />
    </div>
  );
}
