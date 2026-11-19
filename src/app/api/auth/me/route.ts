import { apiHandler, json } from "@/lib/api/handler";

export const GET = apiHandler(async ({ user }) => json(user));
