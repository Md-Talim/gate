import { redirect } from "react-router";
import type { Route } from "../+types/root";

const API_BASE = process.env.VITE_BACKEND_API_URL;

export function loader({ params }: Route.LoaderArgs) {
  return redirect(`${API_BASE}/${params.shortUrl}`);
}
