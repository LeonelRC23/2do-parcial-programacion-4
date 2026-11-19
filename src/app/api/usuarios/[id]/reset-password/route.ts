import { apiHandler, json } from "@/lib/api/handler";
import { resetPassword } from "@/lib/services/usuarios";
import { idParamSchema } from "@/lib/schemas/common";

export const POST = apiHandler(
  async ({ user, params }) => {
    const id = idParamSchema.parse(params.id);
    return json(await resetPassword(user!, id));
  },
  { admin: true },
);
