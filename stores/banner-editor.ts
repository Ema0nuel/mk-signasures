import { create } from "zustand";
import type { HeroSlideCta } from "@/types/database";

export interface SlideCTA extends HeroSlideCta {
  /** Temporary ID for newly added CTAs that haven't been saved to DB yet */
  _isNew?: boolean;
}

interface BannerEditorState {
  /** CTAs for the currently active slide, managed locally */
  ctas: SlideCTA[];
  /** Original CTAs loaded from DB, used for diffing on save */
  originalCtas: SlideCTA[];

  /** Hydrate CTAs from DB data */
  setCtas: (ctas: SlideCTA[]) => void;

  /** Add a new CTA locally (no DB write) */
  addCta: () => void;

  /** Update a CTA field locally (no DB write) */
  updateCta: (ctaId: string, updates: Partial<Pick<SlideCTA, "label" | "href" | "variant">>) => void;

  /** Remove a CTA locally (no DB write) */
  removeCta: (ctaId: string) => void;

  /** Check if there are unsaved CTA changes */
  hasUnsavedChanges: () => boolean;

  /** Get CTAs that need to be created (new), updated (changed), or deleted (removed) */
  getDirtyCtas: () => {
    toCreate: SlideCTA[];
    toUpdate: Array<{ id: string; updates: Partial<Pick<SlideCTA, "label" | "href" | "variant">> }>;
    toDelete: string[];
  };

  /** After successful save, mark all CTAs as persisted */
  markSaved: (savedCtas: SlideCTA[]) => void;
}

export const useBannerEditorStore = create<BannerEditorState>((set, get) => ({
  ctas: [],
  originalCtas: [],

  setCtas: (ctas) => set({ ctas, originalCtas: ctas }),

  addCta: () => {
    const { ctas } = get();
    const newCta: SlideCTA = {
      id: `temp_${crypto.randomUUID()}`,
      slide_id: "",
      label: "Button",
      href: "/shop",
      variant: "primary",
      sort_order: ctas.length,
      created_at: new Date().toISOString(),
      _isNew: true,
    };
    set({ ctas: [...ctas, newCta] });
  },

  updateCta: (ctaId, updates) => {
    const { ctas } = get();
    set({
      ctas: ctas.map((c) =>
        c.id === ctaId ? { ...c, ...updates } : c
      ),
    });
  },

  removeCta: (ctaId) => {
    const { ctas } = get();
    set({ ctas: ctas.filter((c) => c.id !== ctaId) });
  },

  hasUnsavedChanges: () => {
    const { ctas, originalCtas } = get();

    // Different number of CTAs
    if (ctas.length !== originalCtas.length) return true;

    // Check for new CTAs
    if (ctas.some((c) => c._isNew)) return true;

    // Check for removed CTAs (original IDs not in current)
    const currentIds = new Set(ctas.map((c) => c.id));
    if (originalCtas.some((c) => !currentIds.has(c.id))) return true;

    // Check for modified CTAs
    for (const cta of ctas) {
      if (cta._isNew) continue;
      const orig = originalCtas.find((o) => o.id === cta.id);
      if (!orig) return true;
      if (orig.label !== cta.label || orig.href !== cta.href || orig.variant !== cta.variant) {
        return true;
      }
    }

    return false;
  },

  getDirtyCtas: () => {
    const { ctas, originalCtas } = get();
    const toCreate: SlideCTA[] = [];
    const toUpdate: Array<{ id: string; updates: Partial<Pick<SlideCTA, "label" | "href" | "variant">> }> = [];
    const toDelete: string[] = [];

    // CTAs to create (new, temp IDs)
    for (const cta of ctas) {
      if (cta._isNew) {
        toCreate.push(cta);
      }
    }

    // CTAs to update (existing IDs with changed fields)
    for (const cta of ctas) {
      if (cta._isNew) continue;
      const orig = originalCtas.find((o) => o.id === cta.id);
      if (!orig) continue;
      if (orig.label !== cta.label || orig.href !== cta.href || orig.variant !== cta.variant) {
        toUpdate.push({
          id: cta.id,
          updates: {
            ...(orig.label !== cta.label && { label: cta.label }),
            ...(orig.href !== cta.href && { href: cta.href }),
            ...(orig.variant !== cta.variant && { variant: cta.variant }),
          },
        });
      }
    }

    // CTAs to delete (in original but not in current)
    const currentIds = new Set(ctas.map((c) => c.id));
    for (const orig of originalCtas) {
      if (!currentIds.has(orig.id)) {
        toDelete.push(orig.id);
      }
    }

    return { toCreate, toUpdate, toDelete };
  },

  markSaved: (savedCtas) => set({ ctas: savedCtas, originalCtas: savedCtas }),
}));
