import { ArrowUpRight, Briefcase, ChevronLeft, ChevronRight, Loader2, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { RecommendedOpportunityCard } from "@/components/dashboard/RecommendedOpportunityCard";
import { cn } from "@/lib/utils";
import type { OpportunityRecommendation } from "@/types/opportunityMatch";

type Props = {
  recommendations: OpportunityRecommendation[];
  loading: boolean;
  message?: string | null;
};

export function RecommendedOpportunitiesCarousel({ recommendations, loading, message }: Props) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setSelectedIndex(carouselApi.selectedScrollSnap());
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    };

    setSnapCount(carouselApi.scrollSnapList().length);
    onSelect();
    carouselApi.on("select", onSelect);
    carouselApi.on("reInit", onSelect);

    return () => {
      carouselApi.off("select", onSelect);
      carouselApi.off("reInit", onSelect);
    };
  }, [carouselApi, recommendations.length]);

  const hasRecommendations = recommendations.length > 0;

  return (
    <section className="glass relative overflow-hidden rounded-2xl p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-violet-500/[0.07] to-transparent" />

      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
              <Target className="h-4 w-4 text-cyan-300" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">Personalized for you</div>
              <h2 className="font-display text-[16px] font-semibold text-white">
                Top Recommended Opportunities
              </h2>
            </div>
          </div>
          <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-white/50">
            Ranked by resume match score — swipe or use arrows to browse more picks.
          </p>
        </div>

        <Link
          to="/app/opportunities"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] font-medium text-cyan-200 transition hover:border-cyan-400/25 hover:bg-cyan-400/10"
        >
          View all
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="relative mt-6 flex h-[212px] items-center justify-center rounded-2xl border border-white/8 bg-white/[0.02]">
          <div className="flex items-center gap-2 text-[12px] text-white/45">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
            Loading recommendations…
          </div>
        </div>
      ) : hasRecommendations ? (
        <div className="relative mt-5">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#0b0f1a] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#0b0f1a] to-transparent" />

          <Carousel
            setApi={setCarouselApi}
            opts={{ align: "start", dragFree: true, containScroll: "trimSnaps" }}
            className="w-full"
          >
            <CarouselContent className="-ml-3 md:-ml-4">
              {recommendations.map((row) => (
                <CarouselItem
                  key={row.opportunity.id}
                  className="basis-[86%] pl-3 sm:basis-[calc(50%-0.5rem)] md:pl-4 lg:basis-[calc(33.333%-0.67rem)] xl:basis-[calc(25%-0.75rem)]"
                >
                  <RecommendedOpportunityCard recommendation={row} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          <div className="relative mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => carouselApi?.scrollPrev()}
                disabled={!canScrollPrev}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition",
                  "hover:border-white/20 hover:bg-white/[0.08] hover:text-white",
                  "disabled:cursor-not-allowed disabled:opacity-35",
                )}
                aria-label="Previous recommendations"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => carouselApi?.scrollNext()}
                disabled={!canScrollNext}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition",
                  "hover:border-white/20 hover:bg-white/[0.08] hover:text-white",
                  "disabled:cursor-not-allowed disabled:opacity-35",
                )}
                aria-label="Next recommendations"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="ml-1 hidden text-[11px] text-white/40 sm:inline">
                {recommendations.length} curated {recommendations.length === 1 ? "pick" : "picks"}
              </span>
            </div>

            {snapCount > 1 && (
              <div className="flex items-center gap-1.5">
                {Array.from({ length: snapCount }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => carouselApi?.scrollTo(index)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      selectedIndex === index ? "w-6 bg-gradient-to-r from-cyan-300 to-indigo-400" : "w-1.5 bg-white/20 hover:bg-white/35",
                    )}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Briefcase}
          title="No recommendations yet"
          description={
            message ??
            "Add opportunities and analyze your resume to unlock personalized match recommendations."
          }
          actionLabel="Open opportunities"
          actionTo="/app/opportunities"
          className="relative mt-5 py-8"
        />
      )}
    </section>
  );
}
