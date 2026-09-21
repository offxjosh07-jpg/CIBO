"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/lib/store";
import { useAuth } from "@/components/providers";
import { favApi } from "@/lib/api-client";
import { FoodCard, FoodCardSkeleton } from "../food-card";
import { EmptyState, FoodGrid, PageShell } from "./shared";
import { Button } from "@/components/ui/button";
import { Heart, LogIn } from "lucide-react";

export function FavoritesView() {
  const { user } = useAuth();
  const setCustomer = useApp((s) => s.setCustomer);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => favApi.list(),
    enabled: !!user,
  });

  const remove = useMutation({
    mutationFn: (listingId: string) => favApi.toggle(listingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  if (!user) {
    return (
      <PageShell>
        <EmptyState
          title="Log in to view favorites"
          description="Save your favorite rescues and providers for quick access."
          actionLabel="Log in"
          onAction={() => useApp.getState().setAuthView("login")}
          icon={<LogIn className="size-5" />}
        />
      </PageShell>
    );
  }

  const favorites = (data?.favorites || []).filter((f) => f.listing);
  const listings = favorites.map((f) => f.listing!);

  return (
    <PageShell className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest sm:text-3xl">
            Favorites
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {favorites.length} saved rescue{favorites.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {isLoading ? (
        <FoodGrid>
          {Array.from({ length: 4 }).map((_, i) => (
            <FoodCardSkeleton key={i} />
          ))}
        </FoodGrid>
      ) : listings.length === 0 ? (
        <EmptyState
          title="No favorites yet"
          description="Tap the heart on any rescue to save it here for later."
          actionLabel="Browse rescues"
          onAction={() => setCustomer("explore")}
          icon={<Heart className="size-5" />}
        />
      ) : (
        <FoodGrid>
          {listings.map((l) => (
            <div key={l.id} className="relative">
              <FoodCard listing={l} />
              <Button
                variant="outline"
                size="sm"
                className="absolute right-3 top-3 z-10 size-8 p-0"
                onClick={() => remove.mutate(l.id)}
                aria-label="Remove from favorites"
              >
                <Heart className="size-3.5 fill-orange text-orange" />
              </Button>
            </div>
          ))}
        </FoodGrid>
      )}
    </PageShell>
  );
}
