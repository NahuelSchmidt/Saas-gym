"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function getGymId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await supabase.from("profiles").select("gym_id").eq("id", user.id).single();
  if (!profile?.gym_id) throw new Error("Gimnasio no encontrado");
  return { supabase, gymId: profile.gym_id as string };
}

export type ProductState = { error?: string; success?: string };

// ── Categorías ────────────────────────────────────────────────────────────────

export async function createCategoryAction(_prev: ProductState, formData: FormData): Promise<ProductState> {
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "El nombre es obligatorio." };
  const { supabase, gymId } = await getGymId();
  const { error } = await supabase.from("product_categories").insert({ gym_id: gymId, name });
  if (error) return { error: "No se pudo crear la categoría." };
  revalidatePath("/dashboard/products");
  return { success: `Categoría "${name}" creada.` };
}

export async function deleteCategoryAction(id: string): Promise<ProductState> {
  const { supabase } = await getGymId();
  const { error } = await supabase.from("product_categories").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar." };
  revalidatePath("/dashboard/products");
  return { success: "Categoría eliminada." };
}

// ── Productos ─────────────────────────────────────────────────────────────────

export async function createProductAction(_prev: ProductState, formData: FormData): Promise<ProductState> {
  const name = (formData.get("name") as string)?.trim();
  const price = parseFloat(formData.get("price") as string);
  const stock = parseInt(formData.get("stock") as string) || 0;
  const low_stock_alert = parseInt(formData.get("low_stock_alert") as string) || 5;
  const category_id = (formData.get("category_id") as string) || null;
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) return { error: "El nombre es obligatorio." };
  if (isNaN(price) || price < 0) return { error: "El precio no es válido." };

  const { supabase, gymId } = await getGymId();
  const { error } = await supabase.from("products").insert({
    gym_id: gymId, name, price, stock, low_stock_alert,
    category_id, description, is_active: true,
  });
  if (error) return { error: "No se pudo crear el producto." };
  revalidatePath("/dashboard/products");
  return { success: "Producto creado." };
}

export async function updateProductAction(id: string, _prev: ProductState, formData: FormData): Promise<ProductState> {
  const name = (formData.get("name") as string)?.trim();
  const price = parseFloat(formData.get("price") as string);
  const low_stock_alert = parseInt(formData.get("low_stock_alert") as string) || 5;
  const category_id = (formData.get("category_id") as string) || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const is_active = formData.get("is_active") === "true";

  if (!name) return { error: "El nombre es obligatorio." };
  if (isNaN(price) || price < 0) return { error: "El precio no es válido." };

  const { supabase } = await getGymId();
  const { error } = await supabase.from("products").update({
    name, price, low_stock_alert, category_id, description, is_active,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { error: "No se pudo actualizar el producto." };
  revalidatePath("/dashboard/products");
  return { success: "Producto actualizado." };
}

export async function deleteProductAction(id: string): Promise<ProductState> {
  const { supabase } = await getGymId();
  const { error } = await supabase.from("products").update({ is_active: false }).eq("id", id);
  if (error) return { error: "No se pudo eliminar." };
  revalidatePath("/dashboard/products");
  return { success: "Producto eliminado." };
}

// ── Stock ─────────────────────────────────────────────────────────────────────

export async function adjustStockAction(_prev: ProductState, formData: FormData): Promise<ProductState> {
  const product_id = formData.get("product_id") as string;
  const type = formData.get("type") as "ENTRADA" | "SALIDA";
  const quantity = parseInt(formData.get("quantity") as string);
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!product_id || !type || isNaN(quantity) || quantity <= 0)
    return { error: "Datos inválidos." };

  const { supabase, gymId } = await getGymId();

  // Verificar stock suficiente para salidas
  if (type === "SALIDA") {
    const { data: product } = await supabase.from("products").select("stock").eq("id", product_id).single();
    if (!product || product.stock < quantity)
      return { error: "Stock insuficiente." };
  }

  const delta = type === "ENTRADA" ? quantity : -quantity;

  // Insertar movimiento
  await supabase.from("stock_movements").insert({ gym_id: gymId, product_id, type, quantity, notes });

  // Actualizar stock
  const { data: prod } = await supabase.from("products").select("stock").eq("id", product_id).single();
  if (prod) {
    await supabase.from("products").update({
      stock: Math.max(0, (prod.stock as number) + delta),
      updated_at: new Date().toISOString(),
    }).eq("id", product_id);
  }

  revalidatePath("/dashboard/products");
  return { success: `Stock ${type === "ENTRADA" ? "agregado" : "descontado"} correctamente.` };
}

// ── Ventas ────────────────────────────────────────────────────────────────────

export type SaleItem = { product_id: string; quantity: number; unit_price: number };

export async function createSaleAction(
  items: SaleItem[],
  payment_method: string,
  member_id: string | null,
  notes: string | null
): Promise<ProductState> {
  if (!items.length) return { error: "Agregá al menos un producto." };

  const { supabase, gymId } = await getGymId();

  // Verificar stock
  for (const item of items) {
    const { data: prod } = await supabase.from("products").select("stock, name").eq("id", item.product_id).single();
    if (!prod || (prod.stock as number) < item.quantity)
      return { error: `Stock insuficiente para ${prod?.name ?? "un producto"}.` };
  }

  const total = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({ gym_id: gymId, member_id, total, payment_method, notes })
    .select("id")
    .single();

  if (saleError || !sale) return { error: "No se pudo registrar la venta." };

  const saleItems = items.map((i) => ({
    sale_id: sale.id,
    product_id: i.product_id,
    quantity: i.quantity,
    unit_price: i.unit_price,
    subtotal: i.unit_price * i.quantity,
  }));

  await supabase.from("sale_items").insert(saleItems);

  // Descontar stock
  for (const item of items) {
    const { data: prod } = await supabase.from("products").select("stock").eq("id", item.product_id).single();
    if (prod) {
      await supabase.from("products").update({ stock: Math.max(0, (prod.stock as number) - item.quantity) }).eq("id", item.product_id);
      await supabase.from("stock_movements").insert({
        gym_id: gymId, product_id: item.product_id,
        type: "SALIDA", quantity: item.quantity, notes: `Venta #${sale.id.slice(0, 8)}`,
      });
    }
  }

  revalidatePath("/dashboard/products");
  return { success: "Venta registrada." };
}
