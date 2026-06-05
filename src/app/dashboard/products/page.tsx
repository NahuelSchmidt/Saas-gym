import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Package, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProductsClient from "./ProductsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Productos" };

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("gym_id").eq("id", user.id).single();
  if (!profile?.gym_id) redirect("/dashboard");

  const gymId = profile.gym_id as string;

  const [{ data: products }, { data: categories }, { data: recentSales }] = await Promise.all([
    supabase.from("products").select("*, product_categories(name)").eq("gym_id", gymId).eq("is_active", true).order("name"),
    supabase.from("product_categories").select("*").eq("gym_id", gymId).order("name"),
    supabase.from("sales").select("*, sale_items(quantity, unit_price, subtotal, products(name))").eq("gym_id", gymId).order("created_at", { ascending: false }).limit(10),
  ]);

  const lowStock = (products ?? []).filter((p: any) => p.stock <= p.low_stock_alert);
  const totalProducts = (products ?? []).length;
  const totalStockValue = (products ?? []).reduce((s: number, p: any) => s + p.stock * p.price, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Productos</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Stock y ventas de tu tienda</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Productos activos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalProducts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Valor en stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalStockValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Stock bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-500">{lowStock.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas stock bajo */}
      {lowStock.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Productos con stock bajo
          </p>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((p: any) => (
              <Badge key={p.id} variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-400">
                {p.name} — {p.stock} unid.
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Client component con tabs */}
      <ProductsClient
        products={products ?? []}
        categories={categories ?? []}
        recentSales={recentSales ?? []}
      />
    </div>
  );
}
