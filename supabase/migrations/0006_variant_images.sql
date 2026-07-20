-- Each metal variant can carry its own photo, so selecting a swatch can
-- actually swap the product image instead of only updating price/stock.
-- Nullable: falls back to products.primary_image_url when a variant has no
-- photo of its own.
alter table product_variants add column image_url text;
