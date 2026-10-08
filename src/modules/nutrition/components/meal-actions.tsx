"use client";

import { useRef } from "react";
import type { FoodView } from "@/modules/foods/types";
import type { RecentMeal } from "../domain/recent-meals";
import type { TemplateView } from "../types";
import { FoodPhotoButton, type PhotoControl } from "./food-photo-sheet";
import { LogMealSheet } from "./log-meal-sheet";

/** The two ways to log a meal. "Log meal" can also hand over to the camera. */
export function MealActions({ templates, recent, foods, date, isToday }: { templates: TemplateView[]; recent: RecentMeal[]; foods: FoodView[]; date: string; isToday: boolean }) {
  const photo = useRef<PhotoControl>(null);
  return (
    <div className="grid grid-cols-2 gap-3">
      <LogMealSheet templates={templates} recent={recent} foods={foods} date={date} isToday={isToday} onTakePhoto={() => photo.current?.openCamera()} />
      <FoodPhotoButton date={date} controlRef={photo} />
    </div>
  );
}
