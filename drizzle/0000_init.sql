CREATE TYPE "public"."analysis_status" AS ENUM('pending', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."confidence_level" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."entry_source" AS ENUM('manual', 'template', 'ai_photo');--> statement-breakpoint
CREATE TYPE "public"."equipment" AS ENUM('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other');--> statement-breakpoint
CREATE TYPE "public"."meal_type" AS ENUM('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout', 'before_bed');--> statement-breakpoint
CREATE TYPE "public"."movement_type" AS ENUM('compound', 'isolation');--> statement-breakpoint
CREATE TYPE "public"."muscle_group" AS ENUM('chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'quads', 'hamstrings', 'glutes', 'calves', 'adductors', 'core');--> statement-breakpoint
CREATE TYPE "public"."progress_metric_type" AS ENUM('pr_weight', 'pr_reps', 'pr_e1rm', 'pr_volume');--> statement-breakpoint
CREATE TYPE "public"."quantity_unit" AS ENUM('g', 'ml', 'piece');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('in_progress', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."theme_preference" AS ENUM('system', 'light', 'dark');--> statement-breakpoint
CREATE TYPE "public"."weight_unit" AS ENUM('kg', 'lb');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_muscles" (
	"exercise_id" uuid NOT NULL,
	"muscle" "muscle_group" NOT NULL,
	CONSTRAINT "exercise_muscles_exercise_id_muscle_pk" PRIMARY KEY("exercise_id","muscle")
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"primary_muscle" "muscle_group" NOT NULL,
	"movement_type" "movement_type" NOT NULL,
	"equipment" "equipment",
	"instructions" text,
	"image_url" text,
	"image_urls" text[],
	"default_sets" smallint DEFAULT 3 NOT NULL,
	"default_rep_min" smallint DEFAULT 8 NOT NULL,
	"default_rep_max" smallint DEFAULT 12 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"exercise_id" uuid,
	"position" smallint NOT NULL,
	"name_snapshot" text NOT NULL,
	"primary_muscle_snapshot" "muscle_group" NOT NULL,
	"secondary_muscles_snapshot" "muscle_group"[] DEFAULT '{}' NOT NULL,
	"equipment_snapshot" "equipment",
	"target_sets" smallint NOT NULL,
	"target_rep_min" smallint NOT NULL,
	"target_rep_max" smallint NOT NULL,
	"target_rir_min" smallint NOT NULL,
	"target_rir_max" smallint NOT NULL,
	"allow_failure_on_last_set" boolean DEFAULT false NOT NULL,
	"rest_seconds" smallint NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "workout_day_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workout_day_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"target_sets" smallint NOT NULL,
	"rep_min" smallint NOT NULL,
	"rep_max" smallint NOT NULL,
	"target_rir_min" smallint NOT NULL,
	"target_rir_max" smallint NOT NULL,
	"allow_failure_on_last_set" boolean DEFAULT false NOT NULL,
	"rest_seconds" smallint,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "workout_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"name" text NOT NULL,
	"focus" text NOT NULL,
	"weekday" smallint,
	"position" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"plan_id" uuid,
	"workout_day_id" uuid,
	"name_snapshot" text NOT NULL,
	"focus_snapshot" text NOT NULL,
	"status" "session_status" DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"local_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exercise_session_id" uuid NOT NULL,
	"set_number" smallint NOT NULL,
	"is_warmup" boolean DEFAULT false NOT NULL,
	"weight_kg" numeric(6, 2),
	"reps" smallint,
	"target_rep_min" smallint,
	"target_rep_max" smallint,
	"rir" smallint,
	"rpe" numeric(3, 1),
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_photo_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"status" "analysis_status" DEFAULT 'pending' NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"provider" text,
	"model" text,
	"result" jsonb,
	"confidence" "confidence_level",
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"calories_per_100" numeric(7, 2) NOT NULL,
	"protein_per_100" numeric(6, 2) NOT NULL,
	"carbs_per_100" numeric(6, 2) NOT NULL,
	"fat_per_100" numeric(6, 2) NOT NULL,
	"piece_label" text,
	"piece_grams" numeric(7, 2),
	"nutrition_source" text DEFAULT 'user' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meal_id" uuid NOT NULL,
	"food_id" uuid,
	"name_snapshot" text NOT NULL,
	"quantity" numeric(8, 2) NOT NULL,
	"unit" "quantity_unit" NOT NULL,
	"grams" numeric(8, 2) NOT NULL,
	"calories" numeric(8, 2) NOT NULL,
	"protein" numeric(7, 2) NOT NULL,
	"carbs" numeric(7, 2) NOT NULL,
	"fat" numeric(7, 2) NOT NULL,
	"ai_confidence" numeric(3, 2)
);
--> statement-breakpoint
CREATE TABLE "meal_template_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"food_id" uuid NOT NULL,
	"quantity" numeric(8, 2) NOT NULL,
	"unit" "quantity_unit" NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	"option_group" text,
	"is_default_option" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"meal_type" "meal_type" NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"meal_type" "meal_type" NOT NULL,
	"name" text,
	"eaten_at" timestamp with time zone DEFAULT now() NOT NULL,
	"local_date" date NOT NULL,
	"source" "entry_source" DEFAULT 'manual' NOT NULL,
	"template_id" uuid,
	"photo_analysis_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "body_measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"measured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"local_date" date NOT NULL,
	"weight_kg" numeric(5, 2),
	"body_fat_percent" numeric(4, 1),
	"waist_cm" numeric(5, 1),
	"chest_cm" numeric(5, 1),
	"arm_cm" numeric(5, 1),
	"leg_cm" numeric(5, 1),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "progress_metric_type" NOT NULL,
	"exercise_id" uuid,
	"exercise_name_snapshot" text,
	"value" numeric(10, 2) NOT NULL,
	"achieved_at" timestamp with time zone NOT NULL,
	"source_set_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"weight_unit" "weight_unit" DEFAULT 'kg' NOT NULL,
	"theme" "theme_preference" DEFAULT 'system' NOT NULL,
	"week_starts_on" smallint DEFAULT 1 NOT NULL,
	"weekly_workout_target" smallint DEFAULT 5 NOT NULL,
	"rest_timer_enabled" boolean DEFAULT true NOT NULL,
	"default_rest_seconds" smallint DEFAULT 120 NOT NULL,
	"target_calories" integer,
	"target_protein_g" integer,
	"target_carbs_g" integer,
	"target_fat_g" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_muscles" ADD CONSTRAINT "exercise_muscles_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_sessions" ADD CONSTRAINT "exercise_sessions_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_sessions" ADD CONSTRAINT "exercise_sessions_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_day_exercises" ADD CONSTRAINT "workout_day_exercises_workout_day_id_workout_days_id_fk" FOREIGN KEY ("workout_day_id") REFERENCES "public"."workout_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_day_exercises" ADD CONSTRAINT "workout_day_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_days" ADD CONSTRAINT "workout_days_plan_id_workout_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."workout_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_plan_id_workout_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."workout_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_workout_day_id_workout_days_id_fk" FOREIGN KEY ("workout_day_id") REFERENCES "public"."workout_days"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_exercise_session_id_exercise_sessions_id_fk" FOREIGN KEY ("exercise_session_id") REFERENCES "public"."exercise_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_photo_analyses" ADD CONSTRAINT "food_photo_analyses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foods" ADD CONSTRAINT "foods_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_template_items" ADD CONSTRAINT "meal_template_items_template_id_meal_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."meal_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_template_items" ADD CONSTRAINT "meal_template_items_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_templates" ADD CONSTRAINT "meal_templates_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_template_id_meal_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."meal_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_measurements" ADD CONSTRAINT "body_measurements_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_metrics" ADD CONSTRAINT "progress_metrics_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_metrics" ADD CONSTRAINT "progress_metrics_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_metrics" ADD CONSTRAINT "progress_metrics_source_set_id_workout_sets_id_fk" FOREIGN KEY ("source_set_id") REFERENCES "public"."workout_sets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exercises_builtin_slug_uq" ON "exercises" USING btree ("slug") WHERE "exercises"."owner_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "exercises_owner_slug_uq" ON "exercises" USING btree ("owner_id","slug");--> statement-breakpoint
CREATE INDEX "exercises_owner_idx" ON "exercises" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "exercise_sessions_session_idx" ON "exercise_sessions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "exercise_sessions_exercise_idx" ON "exercise_sessions" USING btree ("exercise_id");--> statement-breakpoint
CREATE INDEX "workout_day_exercises_day_idx" ON "workout_day_exercises" USING btree ("workout_day_id");--> statement-breakpoint
CREATE INDEX "workout_days_plan_idx" ON "workout_days" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "workout_plans_user_idx" ON "workout_plans" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workout_sessions_user_started_idx" ON "workout_sessions" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE INDEX "workout_sessions_user_date_idx" ON "workout_sessions" USING btree ("user_id","local_date");--> statement-breakpoint
CREATE UNIQUE INDEX "workout_sessions_one_active_uq" ON "workout_sessions" USING btree ("user_id") WHERE "workout_sessions"."status" = 'in_progress';--> statement-breakpoint
CREATE UNIQUE INDEX "workout_sets_exercise_session_number_uq" ON "workout_sets" USING btree ("exercise_session_id","set_number");--> statement-breakpoint
CREATE INDEX "workout_sets_exercise_session_idx" ON "workout_sets" USING btree ("exercise_session_id");--> statement-breakpoint
CREATE INDEX "food_photo_analyses_user_idx" ON "food_photo_analyses" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "foods_builtin_slug_uq" ON "foods" USING btree ("slug") WHERE "foods"."owner_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "foods_owner_slug_uq" ON "foods" USING btree ("owner_id","slug");--> statement-breakpoint
CREATE INDEX "foods_owner_idx" ON "foods" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "meal_items_meal_idx" ON "meal_items" USING btree ("meal_id");--> statement-breakpoint
CREATE INDEX "meal_template_items_template_idx" ON "meal_template_items" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "meal_templates_user_idx" ON "meal_templates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "meals_user_date_idx" ON "meals" USING btree ("user_id","local_date");--> statement-breakpoint
CREATE INDEX "body_measurements_user_date_idx" ON "body_measurements" USING btree ("user_id","local_date");--> statement-breakpoint
CREATE INDEX "progress_metrics_user_type_idx" ON "progress_metrics" USING btree ("user_id","type","exercise_id");