CREATE TABLE "nster_library_imports" (
	"id" text PRIMARY KEY,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nster_library_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"question" varchar(160) NOT NULL,
	"answer" text NOT NULL,
	"code" text DEFAULT '' NOT NULL,
	"language" varchar(24) DEFAULT '' NOT NULL,
	"filename" varchar(128) DEFAULT '' NOT NULL,
	"created_by" uuid,
	"source_key" text UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
