"use client";

import { useState, useTransition } from "react";
import { Plus, Package, ShoppingCart, BarChart3, Pencil, Trash2, ArrowUp, ArrowDown, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  createProductAction, updateProductAction, deleteProductAction,
  adjustStockAction, createSaleAction, createCategoryAction,
  type SaleItem,
} from "./actions";

type Product = {
  id: string; name: string; price: number; stock: number;
  low_stock_alert: number; description: string | null;
  category_id: string | null; is_active: boolean;
  product_categories: { name: string } | null;
};
type Category = { id: string; name: string };
type Sale = {
  id: string; total: number; payment_method: string;
  created_at: string; notes: string | null;
  sale_items: { quantity: number; unit_price: number; subtotal: number; products: { name: string } | null }[];
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
      type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
    }`}>
      {type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {msg}
    </div>
  );
}

// ── Modal genérico ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[hsl(220,10%,20%)] rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

// ── ProductsClient ────────────────────────────────────────────────────────────
export default function ProductsClient({ products, categories, recentSales }: {
  products: Product[]; categories: Category[]; recentSales: Sale[];
}) {
  const [tab, setTab] = useState<"productos" | "vender" | "ventas" | "categorias">("productos");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Modal states
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState<Product | null>(null);
  const [showStock, setShowStock] = useState<Product | null>(null);
  const [showNewCategory, setShowNewCategory] = useState(false);

  // Venta
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [payMethod, setPayMethod] = useState("EFECTIVO");
  const [saleNotes, setSaleNotes] = useState("");

  function notify(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Agregar al carrito ──
  function addToCart(product: Product) {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) { notify("Stock insuficiente", "error"); return prev; }
        return prev.map((i) => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      if (product.stock < 1) { notify("Sin stock", "error"); return prev; }
      return [...prev, { product_id: product.id, quantity: 1, unit_price: product.price }];
    });
  }

  function removeFromCart(id: string) { setCartItems((p) => p.filter((i) => i.product_id !== id)); }
  function updateCartQty(id: string, qty: number) {
    if (qty < 1) { removeFromCart(id); return; }
    setCartItems((p) => p.map((i) => i.product_id === id ? { ...i, quantity: qty } : i));
  }

  const cartTotal = cartItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);

  async function handleSale() {
    startTransition(async () => {
      const res = await createSaleAction(cartItems, payMethod, null, saleNotes || null);
      if (res.error) { notify(res.error, "error"); return; }
      notify("Venta registrada correctamente");
      setCartItems([]);
      setSaleNotes("");
    });
  }

  const tabs = [
    { id: "productos", label: "Productos", icon: Package },
    { id: "vender", label: "Nueva venta", icon: ShoppingCart },
    { id: "ventas", label: "Ventas", icon: BarChart3 },
    { id: "categorias", label: "Categorías", icon: Package },
  ];

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 dark:bg-white/10 p-1 rounded-lg w-fit flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.id ? "bg-white dark:bg-[hsl(220,10%,26%)] text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PRODUCTOS ── */}
      {tab === "productos" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowNewProduct(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" /> Nuevo producto
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.map((p) => (
              <Card key={p.id} className={p.stock <= p.low_stock_alert ? "border-amber-300 dark:border-amber-500/40" : ""}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{p.name}</p>
                      {p.product_categories && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{p.product_categories.name}</p>
                      )}
                    </div>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(p.price)}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${p.stock <= p.low_stock_alert ? "text-amber-500" : "text-gray-900 dark:text-gray-100"}`}>
                        {p.stock}
                      </span>
                      <span className="text-xs text-gray-400">unid.</span>
                      {p.stock <= p.low_stock_alert && (
                        <Badge variant="outline" className="text-xs border-amber-300 text-amber-600">Stock bajo</Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setShowStock(p)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors" title="Ajustar stock">
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button onClick={() => setShowEditProduct(p)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => {
                        startTransition(async () => {
                          const res = await deleteProductAction(p.id);
                          if (res.error) notify(res.error, "error"); else notify("Producto eliminado");
                        });
                      }} className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {products.length === 0 && (
              <div className="col-span-3 flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
                <Package className="w-12 h-12 opacity-30" />
                <p>No hay productos. Creá el primero.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VENDER ── */}
      {tab === "vender" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Catálogo */}
          <div className="xl:col-span-2 space-y-3">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Seleccioná los productos</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {products.filter((p) => p.stock > 0).map((p) => (
                <button key={p.id} onClick={() => addToCart(p)}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[hsl(220,10%,20%)] hover:border-blue-400 hover:shadow-md transition-all text-left">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.stock} disponibles</p>
                  </div>
                  <p className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(p.price)}</p>
                </button>
              ))}
              {products.filter((p) => p.stock > 0).length === 0 && (
                <p className="text-sm text-gray-400 col-span-2">No hay productos con stock disponible.</p>
              )}
            </div>
          </div>

          {/* Carrito */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Carrito
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Seleccioná productos del catálogo</p>
                ) : (
                  <div className="space-y-2">
                    {cartItems.map((item) => {
                      const prod = products.find((p) => p.id === item.product_id);
                      return (
                        <div key={item.product_id} className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{prod?.name}</p>
                            <p className="text-xs text-gray-400">{formatCurrency(item.unit_price)} c/u</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateCartQty(item.product_id, item.quantity - 1)}
                              className="w-6 h-6 rounded border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10">
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-medium text-gray-900 dark:text-gray-100">{item.quantity}</span>
                            <button onClick={() => updateCartQty(item.product_id, item.quantity + 1)}
                              className="w-6 h-6 rounded border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10">
                              <ArrowUp className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 w-16 text-right">
                            {formatCurrency(item.unit_price * item.quantity)}
                          </p>
                          <button onClick={() => removeFromCart(item.product_id)}
                            className="text-gray-300 hover:text-red-500 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {cartItems.length > 0 && (
                  <>
                    <div className="border-t border-gray-100 dark:border-white/10 pt-3 space-y-3">
                      <div className="flex justify-between font-bold text-gray-900 dark:text-gray-100">
                        <span>Total</span>
                        <span>{formatCurrency(cartTotal)}</span>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Método de pago</Label>
                        <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                          className="w-full rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[hsl(220,10%,22%)] text-gray-900 dark:text-gray-100 px-3 py-2 text-sm">
                          <option value="EFECTIVO">Efectivo</option>
                          <option value="TRANSFERENCIA">Transferencia</option>
                          <option value="TARJETA">Tarjeta</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Notas (opcional)</Label>
                        <Input value={saleNotes} onChange={(e) => setSaleNotes(e.target.value)} placeholder="Ej: cliente especial" />
                      </div>
                      <button onClick={handleSale} disabled={isPending}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors">
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                        {isPending ? "Procesando…" : "Confirmar venta"}
                      </button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── VENTAS ── */}
      {tab === "ventas" && (
        <div className="space-y-3">
          {recentSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <ShoppingCart className="w-12 h-12 opacity-30" />
              <p>No hay ventas registradas aún.</p>
            </div>
          ) : (
            recentSales.map((sale) => (
              <Card key={sale.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatDate(sale.created_at, "dd/MM/yyyy HH:mm")}</p>
                      <Badge variant="outline" className="text-xs mt-1">{sale.payment_method}</Badge>
                    </div>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(sale.total)}</p>
                  </div>
                  <div className="space-y-1">
                    {sale.sale_items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>{item.products?.name} × {item.quantity}</span>
                        <span>{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ── CATEGORIAS ── */}
      {tab === "categorias" && (
        <div className="max-w-md space-y-4">
          <button onClick={() => setShowNewCategory(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> Nueva categoría
          </button>
          <div className="space-y-2">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.name}</p>
                <button onClick={() => {
                  startTransition(async () => {
                    const { deleteCategoryAction: del } = await import("./actions");
                    const res = await del(c.id);
                    if (res.error) notify(res.error, "error"); else notify("Categoría eliminada");
                  });
                }} className="text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {categories.length === 0 && <p className="text-sm text-gray-400">No hay categorías aún.</p>}
          </div>
        </div>
      )}

      {/* ── MODALES ── */}

      {/* Nuevo producto */}
      {showNewProduct && (
        <Modal title="Nuevo producto" onClose={() => setShowNewProduct(false)}>
          <form action={async (fd) => {
            startTransition(async () => {
              const res = await createProductAction({}, fd);
              if (res.error) notify(res.error, "error");
              else { notify(res.success!); setShowNewProduct(false); }
            });
          }} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" name="name" required placeholder="Ej: Proteína Whey 1kg" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="price">Precio *</Label>
                <Input id="price" name="price" type="number" min="0" step="0.01" required placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stock">Stock inicial</Label>
                <Input id="stock" name="stock" type="number" min="0" defaultValue="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="low_stock_alert">Alerta stock bajo</Label>
                <Input id="low_stock_alert" name="low_stock_alert" type="number" min="0" defaultValue="5" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category_id">Categoría</Label>
                <select id="category_id" name="category_id"
                  className="w-full rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[hsl(220,10%,22%)] text-gray-900 dark:text-gray-100 px-3 py-2 text-sm">
                  <option value="">Sin categoría</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" name="description" placeholder="Opcional" />
            </div>
            <button type="submit" disabled={isPending}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Crear producto
            </button>
          </form>
        </Modal>
      )}

      {/* Editar producto */}
      {showEditProduct && (
        <Modal title="Editar producto" onClose={() => setShowEditProduct(null)}>
          <form action={async (fd) => {
            startTransition(async () => {
              const res = await updateProductAction(showEditProduct.id, {}, fd);
              if (res.error) notify(res.error, "error");
              else { notify(res.success!); setShowEditProduct(null); }
            });
          }} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input name="name" required defaultValue={showEditProduct.name} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Precio *</Label>
                <Input name="price" type="number" min="0" step="0.01" required defaultValue={showEditProduct.price} />
              </div>
              <div className="space-y-1.5">
                <Label>Alerta stock bajo</Label>
                <Input name="low_stock_alert" type="number" min="0" defaultValue={showEditProduct.low_stock_alert} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <select name="category_id"
                defaultValue={showEditProduct.category_id ?? ""}
                className="w-full rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[hsl(220,10%,22%)] text-gray-900 dark:text-gray-100 px-3 py-2 text-sm">
                <option value="">Sin categoría</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <select name="is_active" defaultValue={String(showEditProduct.is_active)}
                className="w-full rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[hsl(220,10%,22%)] text-gray-900 dark:text-gray-100 px-3 py-2 text-sm">
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
            <input type="hidden" name="description" value={showEditProduct.description ?? ""} />
            <button type="submit" disabled={isPending}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Guardar cambios
            </button>
          </form>
        </Modal>
      )}

      {/* Ajuste de stock */}
      {showStock && (
        <Modal title={`Stock — ${showStock.name}`} onClose={() => setShowStock(null)}>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Stock actual: <span className="font-bold text-gray-900 dark:text-gray-100">{showStock.stock} unidades</span></p>
          <form action={async (fd) => {
            fd.append("product_id", showStock.id);
            startTransition(async () => {
              const res = await adjustStockAction({}, fd);
              if (res.error) notify(res.error, "error");
              else { notify(res.success!); setShowStock(null); }
            });
          }} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tipo de movimiento</Label>
              <select name="type"
                className="w-full rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[hsl(220,10%,22%)] text-gray-900 dark:text-gray-100 px-3 py-2 text-sm">
                <option value="ENTRADA">Entrada (agregar stock)</option>
                <option value="SALIDA">Salida (descontar stock)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Cantidad</Label>
              <Input name="quantity" type="number" min="1" required placeholder="Ej: 10" />
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Input name="notes" placeholder="Ej: compra proveedor" />
            </div>
            <button type="submit" disabled={isPending}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Confirmar
            </button>
          </form>
        </Modal>
      )}

      {/* Nueva categoría */}
      {showNewCategory && (
        <Modal title="Nueva categoría" onClose={() => setShowNewCategory(false)}>
          <form action={async (fd) => {
            startTransition(async () => {
              const res = await createCategoryAction({}, fd);
              if (res.error) notify(res.error, "error");
              else { notify(res.success!); setShowNewCategory(false); }
            });
          }} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input name="name" required placeholder="Ej: Proteínas, Indumentaria…" />
            </div>
            <button type="submit" disabled={isPending}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-60">
              Crear categoría
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
