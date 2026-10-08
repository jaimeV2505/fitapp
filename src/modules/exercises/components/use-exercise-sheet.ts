"use client";

import { useCallback, useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { getExerciseDetailAction } from "../actions";
import type { ExerciseDetail } from "../types";

export interface ExerciseSheetState {
  open: boolean;
  loading: boolean;
  error: string | null;
  title: string;
  detail: ExerciseDetail | null;
}

const CLOSED: ExerciseSheetState = { open: false, loading: false, error: null, title: "", detail: null };

/** Opens the exercise detail sheet and loads its data on demand (driven by a tap, not an effect). */
export function useExerciseSheet() {
  const [state, setState] = useState<ExerciseSheetState>(CLOSED);
  const t = useT();
  const latestRequest = useRef(0);

  const show = useCallback((target: { exerciseId: string | null; name: string }) => {
    const request = ++latestRequest.current;
    if (!target.exerciseId) {
      setState({ open: true, loading: false, error: t("exercise.detailsUnavailable"), title: target.name, detail: null });
      return;
    }
    setState({ open: true, loading: true, error: null, title: target.name, detail: null });
    void getExerciseDetailAction({ exerciseId: target.exerciseId }).then((result) => {
      if (request !== latestRequest.current) return; // a newer tap replaced this one
      setState((current) =>
        result.ok
          ? { ...current, loading: false, detail: result.data }
          : { ...current, loading: false, error: result.error },
      );
    });
  }, [t]);

  const setOpen = useCallback((open: boolean) => {
    setState((current) => ({ ...current, open }));
  }, []);

  return { state, show, setOpen };
}
