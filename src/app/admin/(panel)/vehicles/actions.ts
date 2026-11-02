"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePerm } from "@/lib/auth";
import { run } from "@/lib/db";

const t = (fd: FormData, k: string, max = 80) => String(fd.get(k) ?? "").trim().slice(0, max);
const yr = (fd: FormData, k: string) => {
  const s = t(fd, k, 4);
  return /^\d{4}$/.test(s) ? Number(s) : null;
};
const done = (msg: string): never => {
  revalidatePath("/finder");
  redirect(`/admin/vehicles?msg=${encodeURIComponent(msg)}`);
};

export async function addMake(fd: FormData) {
  await requirePerm("vehicles");
  const name = t(fd, "name");
  if (!name) done("Enter a make name.");
  await run("INSERT INTO vehicle_makes(name) VALUES(?) ON CONFLICT DO NOTHING", name);
  done("Make added.");
}
export async function addModel(fd: FormData) {
  await requirePerm("vehicles");
  const name = t(fd, "name");
  if (!name || !Number(fd.get("make_id"))) done("Choose a make and enter a model.");
  await run("INSERT INTO vehicle_models(make_id, name) VALUES(?,?) ON CONFLICT DO NOTHING", Number(fd.get("make_id")), name);
  done("Model added.");
}
export async function addGeneration(fd: FormData) {
  await requirePerm("vehicles");
  const name = t(fd, "name");
  if (!name || !Number(fd.get("model_id"))) done("Choose a model and enter a generation name.");
  await run(
    "INSERT INTO vehicle_generations(model_id, name, chassis_code, year_from, year_to, engines) VALUES(?,?,?,?,?,?)",
    Number(fd.get("model_id")), name, t(fd, "chassis_code") || null, yr(fd, "year_from"), yr(fd, "year_to"), t(fd, "engines", 300),
  );
  done("Generation added.");
}
export async function removeVehicle(fd: FormData) {
  await requirePerm("vehicles");
  const table = { make: "vehicle_makes", model: "vehicle_models", gen: "vehicle_generations" }[String(fd.get("kind"))];
  if (table) await run(`DELETE FROM ${table} WHERE id = ?`, Number(fd.get("id")));
  done("Removed.");
}
