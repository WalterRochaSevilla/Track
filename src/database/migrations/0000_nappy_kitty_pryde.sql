CREATE TABLE "empresa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nit" text NOT NULL,
	"razon_social" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "factura" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"nit_emisor" text NOT NULL,
	"razon_social_emisor" text NOT NULL,
	"numero_factura" text NOT NULL,
	"numero_autorizacion" text,
	"fecha_emision" date NOT NULL,
	"nit_comprador" text,
	"importe_total" numeric(12, 2) NOT NULL,
	"descuentos" numeric(12, 2) DEFAULT '0',
	"base_credito_fiscal" numeric(12, 2) NOT NULL,
	"hash_dedup" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "factura" ADD CONSTRAINT "factura_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "empresa_nit_unique" ON "empresa" USING btree ("nit");--> statement-breakpoint
CREATE UNIQUE INDEX "factura_empresa_hash_unique" ON "factura" USING btree ("empresa_id","hash_dedup");