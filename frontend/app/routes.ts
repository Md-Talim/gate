import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/landing.tsx"),
  route("register", "routes/register.tsx"),
  route("login", "routes/login.tsx"),
  route("s/:shortUrl", "routes/redirect.tsx"),
  layout("routes/auth-layout.tsx", [route("app", "routes/app.tsx")]),
] satisfies RouteConfig;
