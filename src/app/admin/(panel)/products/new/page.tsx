import { requirePerm } from "@/lib/auth";
import { ProductForm } from "../product-form";

export default async function NewProduct({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const staff = await requirePerm("products");
  const { error } = await searchParams;
  return (
    <div className="space-y-4">
      <h1 className="text-4xl">Add product</h1>
      {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm font-bold text-brand">{error}</p>}
      <ProductForm alts={[]} compat={[]} role={staff.role} />
    </div>
  );
}
