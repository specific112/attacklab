import { destroySession } from "@/lib/auth";
import { success } from "@/lib/api-response";

export async function POST() {
  await destroySession();
  return success({ message: "Logged out successfully" });
}
