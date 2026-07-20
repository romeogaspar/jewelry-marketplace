"use client";

import { useActionState, useMemo, useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import type { FormState } from "@/lib/actions/products";

type Category = {
  id: string;
  parent_id: string | null;
  name: string;
  level: number;
};

type Variant = {
  metal_type: string;
  swatch_hex: string;
  price_delta: number;
  stock: number;
  image_url: string | null;
};

type ExistingProduct = {
  id: string;
  title: string;
  description: string | null;
  base_price: number;
  stock: number;
  category_id: string;
  primary_image_url: string | null;
  variants: Variant[];
};

const METALS: { type: string; label: string; defaultHex: string }[] = [
  { type: "white_gold", label: "White Gold", defaultHex: "#e8e8e8" },
  { type: "yellow_gold", label: "Yellow Gold", defaultHex: "#d4af37" },
  { type: "rose_gold", label: "Rose Gold", defaultHex: "#e0aa94" },
  { type: "silver", label: "Silver", defaultHex: "#c0c0c0" },
];

const initialState: FormState = {};

function ancestryChain(categories: Category[], categoryId: string) {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const chain: string[] = [];
  let current = byId.get(categoryId);
  while (current) {
    chain.unshift(current.id);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return chain;
}

export default function ProductForm({
  categories,
  existingProduct,
  action,
  submitLabel,
}: {
  categories: Category[];
  existingProduct?: ExistingProduct;
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
}) {
  const [state, formAction, isSubmitting] = useActionState(action, initialState);

  const initialChain = existingProduct
    ? ancestryChain(categories, existingProduct.category_id)
    : [];

  const [l1, setL1] = useState(initialChain[0] ?? "");
  const [l2, setL2] = useState(initialChain[1] ?? "");
  const [l3, setL3] = useState(initialChain[2] ?? "");

  const level1Options = useMemo(
    () => categories.filter((c) => c.level === 1),
    [categories]
  );
  const level2Options = useMemo(
    () => categories.filter((c) => c.parent_id === l1),
    [categories, l1]
  );
  const level3Options = useMemo(
    () => categories.filter((c) => c.parent_id === l2),
    [categories, l2]
  );

  const selectedCategoryId = l3 || l2 || l1;

  const variantByType = new Map(
    (existingProduct?.variants ?? []).map((v) => [v.metal_type, v])
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {existingProduct && <input type="hidden" name="id" value={existingProduct.id} />}

      <Input
        label="Product Title"
        type="text"
        id="title"
        defaultValue={existingProduct?.title}
        required
      />

      <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
        Description
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={existingProduct?.description ?? ""}
          className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Base Price (USD)"
          type="number"
          id="base-price"
          step="0.01"
          min={0}
          defaultValue={existingProduct?.base_price}
          required
        />
        <Input
          label="Stock"
          type="number"
          id="stock"
          min={0}
          defaultValue={existingProduct?.stock ?? 0}
          required
        />
      </div>

      <Input
        label="Primary Image URL"
        type="url"
        id="primary-image-url"
        defaultValue={existingProduct?.primary_image_url ?? ""}
        placeholder="https://..."
      />

      <div>
        <p className="mb-1 text-sm font-medium text-neutral-700">Category</p>
        <div className="grid grid-cols-3 gap-3">
          <select
            value={l1}
            onChange={(e) => {
              setL1(e.target.value);
              setL2("");
              setL3("");
            }}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            required
          >
            <option value="">Select...</option>
            {level1Options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={l2}
            onChange={(e) => {
              setL2(e.target.value);
              setL3("");
            }}
            disabled={level2Options.length === 0}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-100"
          >
            <option value="">
              {level2Options.length === 0 ? "—" : "Select..."}
            </option>
            {level2Options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={l3}
            onChange={(e) => setL3(e.target.value)}
            disabled={level3Options.length === 0}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-100"
          >
            <option value="">
              {level3Options.length === 0 ? "—" : "Select..."}
            </option>
            {level3Options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <input type="hidden" name="category-id" value={selectedCategoryId} />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-neutral-700">
          Metal Variants
        </p>
        <p className="mb-3 text-xs text-neutral-500">
          Enable the metal types this piece is available in. Each becomes a
          clickable color swatch on the product page.
        </p>
        <div className="space-y-3">
          {METALS.map((metal) => {
            const existing = variantByType.get(metal.type);
            return (
              <div
                key={metal.type}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 p-3"
              >
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                  <input
                    type="checkbox"
                    name={`variant-${metal.type}-enabled`}
                    defaultChecked={Boolean(existing)}
                  />
                  {metal.label}
                </label>
                <label className="flex items-center gap-1 text-xs text-neutral-500">
                  Swatch
                  <input
                    type="color"
                    name={`variant-${metal.type}-hex`}
                    defaultValue={existing?.swatch_hex ?? metal.defaultHex}
                    className="h-7 w-10"
                  />
                </label>
                <label className="flex items-center gap-1 text-xs text-neutral-500">
                  Price delta
                  <input
                    type="number"
                    step="0.01"
                    name={`variant-${metal.type}-price-delta`}
                    defaultValue={existing?.price_delta ?? 0}
                    className="w-20 rounded-lg border border-neutral-300 px-2 py-1"
                  />
                </label>
                <label className="flex items-center gap-1 text-xs text-neutral-500">
                  Stock
                  <input
                    type="number"
                    min={0}
                    name={`variant-${metal.type}-stock`}
                    defaultValue={existing?.stock ?? 0}
                    className="w-20 rounded-lg border border-neutral-300 px-2 py-1"
                  />
                </label>
                <label className="flex flex-1 items-center gap-1 text-xs text-neutral-500">
                  Image URL (optional — falls back to primary image)
                  <input
                    type="url"
                    name={`variant-${metal.type}-image-url`}
                    defaultValue={existing?.image_url ?? ""}
                    placeholder="https://..."
                    className="min-w-[10rem] flex-1 rounded-lg border border-neutral-300 px-2 py-1"
                  />
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {state.error && <ErrorMessage title="Could not save product" message={state.error} />}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
