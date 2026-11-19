import { apiHandler, noContent, readJson } from "@/lib/api/handler";
import { changePassword } from "@/lib/services/auth";

export const PUT = apiHandler(async ({ user, request }) => {
  await changePassword(user!, await readJson(request));
  return noContent();
});
