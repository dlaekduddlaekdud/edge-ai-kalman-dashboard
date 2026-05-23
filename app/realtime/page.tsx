import { redirect } from "next/navigation";

/** /realtime → /results 영구 이동 */
export default function RealtimeRedirectPage() {
  redirect("/results");
}
