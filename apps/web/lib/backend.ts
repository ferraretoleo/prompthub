export function backendUrl(path: string) {
  const base = process.env.BACKEND_URL;
  if (!base) throw new Error("BACKEND_URL não definida");
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
